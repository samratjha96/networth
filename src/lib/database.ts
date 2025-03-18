import { AccountValue, AccountWithValue } from "@/types/accounts";
import { DatabaseProvider } from "@/types/database";
import { NetworthHistory } from "@/types/networth";
import {
  generateMockAccounts,
  generateMockNetworthHistory,
} from "@/lib/mock-data";

export class MockDatabase implements DatabaseProvider {
  private static instance: MockDatabase | null = null;
  private accounts: AccountWithValue[] = [];
  private history: NetworthHistory[] = [];
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
      MockDatabase.instance.initializeInternal();
    }
    return MockDatabase.instance;
  }

  private initializeInternal(): void {
    if (this.isInitialized) return;

    this.accounts = generateMockAccounts();
    const startValue = this.accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );
    this.history = generateMockNetworthHistory(startValue);

    this.isInitialized = true;
  }

  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      this.initializeInternal();
    }
  }

  async close(): Promise<void> {
    console.log("Mock database closed");
  }

  async getAllAccounts(): Promise<AccountWithValue[]> {
    return this.accounts;
  }

  async getAccount(id: string): Promise<AccountWithValue | undefined> {
    return this.accounts.find((account) => account.id === id);
  }

  async insertAccount(
    accountData: Omit<AccountWithValue, "id">,
  ): Promise<AccountWithValue> {
    const newAccount: AccountWithValue = {
      ...accountData,
      id: crypto.randomUUID(),
      balance: accountData.isDebt
        ? -Math.abs(accountData.balance)
        : Math.abs(accountData.balance),
    };

    this.accounts = [...this.accounts, newAccount];
    await this.updateNetworthSnapshot();
    return newAccount;
  }

  async updateAccount(account: AccountWithValue): Promise<void> {
    const index = this.accounts.findIndex((a) => a.id === account.id);

    if (index === -1) {
      throw new Error(`Account with id ${account.id} not found`);
    }

    const updatedAccount = {
      ...account,
      balance: account.isDebt
        ? -Math.abs(account.balance)
        : Math.abs(account.balance),
    };
    this.accounts[index] = updatedAccount;

    if (this.history.length > 0) {
      const newNetWorth = this.accounts.reduce(
        (sum, acc) => sum + acc.balance,
        0,
      );
      const lastEntry = this.history[this.history.length - 1];
      lastEntry.value = newNetWorth;
    }

    await this.updateNetworthSnapshot();
  }

  async deleteAccount(id: string): Promise<void> {
    this.accounts = this.accounts.filter((account) => account.id !== id);
    await this.updateNetworthSnapshot();
  }

  private async updateNetworthSnapshot(): Promise<void> {
    const totalNetworth = await this.calculateCurrentNetworth();
    const now = new Date();

    if (this.history.length > 0) {
      this.history[this.history.length - 1] = {
        date: now.toISOString(),
        value: totalNetworth,
      };
    }
  }

  async calculateCurrentNetworth(): Promise<number> {
    return this.accounts.reduce((sum, account) => sum + account.balance, 0);
  }

  async getAccountValue(accountId: string): Promise<number> {
    const account = await this.getAccount(accountId);
    return account?.balance || 0;
  }

  async getAccountValueHistory(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AccountValue[]> {
    const account = await this.getAccount(accountId);
    if (!account) return [];

    // For mock implementation, return simple history with two points
    const history: AccountValue[] = [
      {
        accountId,
        hourStart: startDate,
        value: account.balance * 0.9, // 10% less at start date
      },
      {
        accountId,
        hourStart: endDate,
        value: account.balance,
      },
    ];

    return history;
  }

  async getNetworthHistory(days: number): Promise<NetworthHistory[]> {
    const currentNetWorth = await this.calculateCurrentNetworth();
    const today = new Date();

    // If history is empty, generate some sample data
    if (this.history.length === 0) {
      console.log("No history data available, generating mock history data");
      this.history = generateMockNetworthHistory(currentNetWorth);
    }

    if (days === 0) {
      const result = [...this.history];
      if (result.length > 0) {
        result[result.length - 1] = {
          date: today.toISOString(),
          value: currentNetWorth,
        };
      }
      return result;
    }

    const endDate = today;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const filteredHistory = this.history
      .filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // If we don't have enough history for the requested time range, generate points
    if (filteredHistory.length < 2) {
      console.log(
        `Not enough history data for ${days} days, generating additional points`,
      );

      // Generate points for the requested time range
      const points: NetworthHistory[] = [];
      for (let i = days; i >= 0; i -= Math.max(1, Math.floor(days / 10))) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Create a simple curve
        const factor = i / days;
        const variation = (Math.random() - 0.5) * 0.05 * currentNetWorth; // 5% random variation
        const value = currentNetWorth * (0.8 + 0.2 * (1 - factor)) + variation;

        points.push({
          date: date.toISOString(),
          value,
        });
      }

      // Ensure the last point has the current net worth
      if (points.length > 0) {
        points[points.length - 1] = {
          date: today.toISOString(),
          value: currentNetWorth,
        };
      }

      return points;
    }

    if (filteredHistory.length > 0) {
      filteredHistory[filteredHistory.length - 1] = {
        date: today.toISOString(),
        value: currentNetWorth,
      };
    } else if (this.history.length > 0) {
      filteredHistory.push({
        date: today.toISOString(),
        value: currentNetWorth,
      });
    }

    return filteredHistory;
  }

  async addNetworthSnapshot(value: number): Promise<void> {
    const newEntry = {
      date: new Date().toISOString(),
      value,
    };

    const MAX_HISTORY_SIZE = 1000;
    this.history = [...this.history, newEntry].slice(-MAX_HISTORY_SIZE);
  }

  async synchronizeNetworthHistory(): Promise<void> {
    const currentNetworth = await this.calculateCurrentNetworth();

    if (this.history.length === 0) {
      await this.addNetworthSnapshot(currentNetworth);
      return;
    }

    this.history[this.history.length - 1] = {
      date: new Date().toISOString(),
      value: currentNetworth,
    };
  }

  // Cleanup resources when switching database providers
  cleanup(): void {
    console.log("Cleaning up mock database resources");
    // Reset any caches or ongoing operations
    this.isInitialized = false;
    // Optional: reset data to initial state
    this.accounts = generateMockAccounts();
    const startValue = this.accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );
    this.history = generateMockNetworthHistory(startValue);
  }
}

export const db = MockDatabase.getInstance();
