import { AccountWithValue } from "@/types/accounts";
import { NetworthHistory, TimeRange } from "@/types/networth";
import { DataService } from "./DataService";
import { getMockDataInstance } from "@/lib/mock-data";
import { v4 as uuidv4 } from "uuid";
import { getStartDateForTimeRange } from "@/utils/time-range";

/**
 * MockDataService provides demo data implementation
 * with simulated CRUD operations that persist in memory during the session
 */
export class MockDataService implements DataService {
  private accounts: AccountWithValue[];
  private networthHistory: NetworthHistory[];

  constructor() {
    // Initialize with mock data
    const mockData = getMockDataInstance();
    this.accounts = [...mockData.accounts];
    this.networthHistory = [...mockData.networthHistory];
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
    const currentValue = this.accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );

    const startDate = getStartDateForTimeRange(timeRange);
    const key = `networth_${startDate.toISOString()}`;

    // Try to get previous value from localStorage or use a calculated value
    let previousValue;
    try {
      const storedValue = localStorage.getItem(key);
      previousValue = storedValue
        ? parseFloat(storedValue)
        : currentValue * 0.95;
    } catch (error) {
      previousValue = currentValue * 0.95;
    }

    // Calculate change metrics
    const change = currentValue - previousValue;
    const percentageChange =
      previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : 0;

    // Store current value for future reference
    try {
      localStorage.setItem(
        `networth_${new Date().toISOString()}`,
        currentValue.toString(),
      );
    } catch (error) {
      console.error("Failed to store net worth in localStorage:", error);
    }

    return {
      currentValue,
      previousValue,
      change,
      percentageChange,
    };
  }

  async getAccountPerformance(timeRange: TimeRange): Promise<
    | {
        account_id: string;
        account_name: string;
        percent_change: number;
        amount_change: number;
      }[]
    | null
  > {
    // Generate mock performance data
    return this.accounts
      .map((account) => {
        const percentChange = Math.random() * 20 - 5; // -5% to 15%
        const amountChange = account.balance * (percentChange / 100);

        return {
          account_id: account.id,
          account_name: account.name,
          percent_change: percentChange,
          amount_change: amountChange,
        };
      })
      .sort((a, b) => b.percent_change - a.percent_change);
  }

  // Helper method to update net worth history when accounts change
  private updateNetworthHistory(): void {
    // Calculate current net worth
    const currentValue = this.accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );

    // Add a new entry to the history
    const now = new Date();
    this.networthHistory.push({
      date: now.toISOString(),
      value: currentValue,
    });
  }
}
