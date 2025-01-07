import { Account } from "@/components/AccountsList"
import { DatabaseProvider, NetworthHistory } from "@/lib/types"

const STORAGE_KEYS = {
  ACCOUNTS: "networth_accounts",
  HISTORY: "networth_history"
};

// Mock database implementation using localStorage
export class MockDatabase implements DatabaseProvider {
  private static instance: MockDatabase | null = null;

  static async getInstance(): Promise<MockDatabase> {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
      await MockDatabase.instance.initialize();
    }
    return MockDatabase.instance;
  }

  private getStoredAccounts(): Account[] {
    const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return stored ? JSON.parse(stored) : [];
  }

  private setStoredAccounts(accounts: Account[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  private getStoredHistory(): NetworthHistory[] {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return stored ? JSON.parse(stored) : [];
  }

  private setStoredHistory(history: NetworthHistory[]): void {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  async initialize(): Promise<void> {
    // Initialize storage if empty
    if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
      this.setStoredAccounts([]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
      this.setStoredHistory([]);
    }
    console.log("Mock database initialized");
  }

  async close(): Promise<void> {
    console.log("Mock database closed");
  }

  // Account operations
  async getAllAccounts(): Promise<Account[]> {
    return this.getStoredAccounts();
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const accounts = this.getStoredAccounts();
    return accounts.find(account => account.id === id);
  }

  async insertAccount(account: Account): Promise<void> {
    const accounts = this.getStoredAccounts();
    this.setStoredAccounts([...accounts, account]);
    await this.updateNetworthSnapshot();
  }

  async updateAccount(account: Account): Promise<void> {
    const accounts = this.getStoredAccounts();
    const index = accounts.findIndex(a => a.id === account.id);
    
    if (index === -1) {
      throw new Error(`Account with id ${account.id} not found`);
    }

    accounts[index] = account;
    this.setStoredAccounts(accounts);
    await this.updateNetworthSnapshot();
  }

  async deleteAccount(id: string): Promise<void> {
    const accounts = this.getStoredAccounts();
    this.setStoredAccounts(accounts.filter(account => account.id !== id));
    await this.updateNetworthSnapshot();
  }

  private async updateNetworthSnapshot(): Promise<void> {
    const accounts = await this.getAllAccounts();
    const totalNetworth = accounts.reduce((sum, account) => sum + account.balance, 0);
    await this.addNetworthSnapshot(totalNetworth);
  }

  // Networth history operations
  async getNetworthHistory(days: number): Promise<NetworthHistory[]> {
    const history = this.getStoredHistory();
    
    // For "ALL", return complete history
    if (days === 0) {
      return history;
    }
    
    // For specific ranges, filter by date
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return history.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  async addNetworthSnapshot(value: number): Promise<void> {
    const history = this.getStoredHistory();
    const newEntry = {
      date: new Date().toISOString(),
      value
    };
    this.setStoredHistory([...history, newEntry]);
  }
}

// Export a singleton instance
export const db = MockDatabase.getInstance();
