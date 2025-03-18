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
  private testMode: boolean = false;

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

  // Enable/disable test mode for mock data generation
  setTestMode(enabled: boolean): void {
    this.testMode = enabled;
    console.log(`Mock database test mode ${enabled ? "enabled" : "disabled"}`);
  }
}

export const db = MockDatabase.getInstance();
