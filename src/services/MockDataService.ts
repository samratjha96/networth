import { AccountWithValue } from "@/types/accounts";
import { NetworthHistory, TimeRange } from "@/types/networth";
import { AccountHistoryEntry } from "@/types/account-history";
import { DataService } from "./DataService";
import {
  getMockDataInstance,
  generateAllAccountHistories,
  generateAccountHistory,
} from "@/lib/mock-data";
import { v4 as uuidv4 } from "uuid";
import { getStartDateForTimeRange } from "@/utils/time-range";
import {
  calculatePercentageChange,
  calculateAccountTotals,
  findValueAsOf,
} from "@/utils/finance";

/**
 * MockDataService provides demo data implementation
 * with simulated CRUD operations that persist in memory during the session
 */
export class MockDataService implements DataService {
  private accounts: AccountWithValue[];
  private networthHistory: NetworthHistory[];
  private accountHistories: Map<string, Array<{ date: string; value: number }>>;

  constructor() {
    // Initialize with mock data
    const mockData = getMockDataInstance();
    this.accounts = [...mockData.accounts];
    this.networthHistory = [...mockData.networthHistory];

    // Generate and cache account histories
    this.accountHistories = generateAllAccountHistories(this.accounts);
  }

  async getAccounts(): Promise<AccountWithValue[]> {
    // Return a copy to avoid direct mutations
    return [...this.accounts];
  }

  async addAccount(
    accountData: Omit<AccountWithValue, "id">,
  ): Promise<AccountWithValue> {
    // Create new account with unique ID
    const newAccount = {
      ...accountData,
      id: `mock-${uuidv4()}`,
    };

    // Add to the accounts list
    this.accounts.push(newAccount);

    // Generate history for the new account (365 days back)
    const today = new Date();
    const startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    const history = generateAccountHistory(
      {
        id: newAccount.id,
        name: newAccount.name,
        type: newAccount.type,
        initialBalance: newAccount.balance,
        currency: newAccount.currency,
        isDebt: newAccount.isDebt,
        growthPattern: { type: "steady", volatility: 0.05 },
      },
      startDate,
      today,
    );
    this.accountHistories.set(newAccount.id, history);

    // Update net worth in the history
    this.updateNetworthHistory();

    return newAccount;
  }

  async updateAccount(account: AccountWithValue): Promise<void> {
    // Find and update the account
    const index = this.accounts.findIndex((a) => a.id === account.id);
    if (index !== -1) {
      this.accounts[index] = { ...account };
      // Update net worth in the history
      this.updateNetworthHistory();
    }
  }

  async deleteAccount(id: string): Promise<void> {
    // Filter out the account
    this.accounts = this.accounts.filter((a) => a.id !== id);
    // Remove account history
    this.accountHistories.delete(id);
    // Update net worth in the history
    this.updateNetworthHistory();
  }

  async getNetWorthHistory(timeRange: TimeRange): Promise<NetworthHistory[]> {
    // Filter history based on time range
    if (timeRange === 0) {
      return [...this.networthHistory];
    }

    const now = new Date();
    const cutoffDate = new Date(
      now.getTime() - timeRange * 24 * 60 * 60 * 1000,
    );

    return this.networthHistory.filter(
      (item) => new Date(item.date) >= cutoffDate,
    );
  }

  async getLatestNetWorth(timeRange: TimeRange): Promise<{
    currentValue: number;
    previousValue: number;
    change: number;
    percentageChange: number;
  } | null> {
    // Calculate current net worth
    const currentValue = calculateAccountTotals(this.accounts).netWorth;

    const startDate = getStartDateForTimeRange(timeRange);

    // Calculate previous net worth: the most recent history entry on or
    // before startDate, i.e. the value as of the start of the range.
    const previousNetWorth = findValueAsOf(this.networthHistory, startDate);

    // If no previous value, use an estimate based on current value
    const previousValue = previousNetWorth?.value || currentValue * 0.95;

    // Calculate change metrics
    const change = currentValue - previousValue;
    const percentageChange = calculatePercentageChange(
      currentValue,
      previousValue,
    );

    return {
      currentValue,
      previousValue,
      change,
      percentageChange,
    };
  }

  async getAccountPerformance(timeRange: TimeRange): Promise<
    {
      account_id: string;
      account_name: string;
      percent_change: number;
      amount_change: number;
    }[]
  > {
    const startDate = getStartDateForTimeRange(timeRange);
    const endDate = new Date();

    const performance = this.accounts.map((account) => {
      const history = this.accountHistories.get(account.id) || [];

      const startValue =
        findValueAsOf(history, startDate)?.value ?? account.balance;
      const endValue =
        findValueAsOf(history, endDate)?.value ?? account.balance;

      const amountChange = endValue - startValue;
      const percentChange = calculatePercentageChange(endValue, startValue);

      return {
        account_id: account.id,
        account_name: account.name,
        percent_change: percentChange,
        amount_change: amountChange,
      };
    });

    return performance.sort((a, b) => b.amount_change - a.amount_change);
  }

  async getAccountHistory(
    accountId: string,
    timeRange: TimeRange,
  ): Promise<AccountHistoryEntry[]> {
    const startDate = getStartDateForTimeRange(timeRange);
    const endDate = new Date();
    const history = this.accountHistories.get(accountId) || [];

    // Filter history to the time range
    const filteredHistory = history.filter((point) => {
      const pointDate = new Date(point.date);
      return pointDate >= startDate && pointDate <= endDate;
    });

    // Get the most recent value before the start date for anchor point
    let anchorPoint: { date: string; value: number } | null = null;
    for (let i = history.length - 1; i >= 0; i--) {
      if (new Date(history[i].date) < startDate) {
        anchorPoint = history[i];
        break;
      }
    }

    // Combine anchor point (if exists) with filtered history
    const result = anchorPoint
      ? [{ ...anchorPoint, isAnchorPoint: true }, ...filteredHistory]
      : filteredHistory;

    return result.map((point) => ({
      date: point.date,
      value: point.value,
      isAnchorPoint: point.isAnchorPoint || false,
    }));
  }

  // Helper method to update net worth history when accounts change
  private updateNetworthHistory(): void {
    // Calculate current net worth
    const currentValue = calculateAccountTotals(this.accounts).netWorth;

    // Add a new entry to the history
    const now = new Date();
    this.networthHistory.push({
      date: now.toISOString(),
      value: currentValue,
    });
  }
}
