import { Account } from "@/components/AccountsList";
import { AccountStorage, SyncAccountStorage } from "./types";
import { DatabaseService } from "./database";

const STORAGE_KEY = "networth_accounts";

// Legacy synchronous implementation
export class LocalAccountStorage implements SyncAccountStorage {
  private getStoredAccounts(): Account[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private setStoredAccounts(accounts: Account[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }

  getAccounts(): Account[] {
    return this.getStoredAccounts();
  }

  addAccount(accountData: Omit<Account, "id">): Account {
    const accounts = this.getStoredAccounts();
    const newAccount: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      balance: accountData.isDebt ? -Math.abs(accountData.balance) : Math.abs(accountData.balance),
    };
    
    this.setStoredAccounts([...accounts, newAccount]);
    return newAccount;
  }

  updateAccount(account: Account): void {
    const accounts = this.getStoredAccounts();
    const index = accounts.findIndex((a) => a.id === account.id);
    
    if (index === -1) {
      throw new Error(`Account with id ${account.id} not found`);
    }

    accounts[index] = {
      ...account,
      balance: account.isDebt ? -Math.abs(account.balance) : Math.abs(account.balance),
    };
    
    this.setStoredAccounts(accounts);
  }

  deleteAccount(id: string): void {
    const accounts = this.getStoredAccounts();
    this.setStoredAccounts(accounts.filter((account) => account.id !== id));
  }
}

// New asynchronous implementation using database
export class DatabaseAccountStorage implements AccountStorage {
  private dbService: DatabaseService | null = null;

  private async getDb(): Promise<DatabaseService> {
    if (!this.dbService) {
      this.dbService = await DatabaseService.getInstance();
    }
    return this.dbService;
  }

  async getAccounts(): Promise<Account[]> {
    const db = await this.getDb();
    return db.getAllAccounts();
  }

  async addAccount(accountData: Omit<Account, "id">): Promise<Account> {
    const db = await this.getDb();
    const newAccount: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      balance: accountData.isDebt ? -Math.abs(accountData.balance) : Math.abs(accountData.balance),
    };
    
    await db.insertAccount(newAccount);
    return newAccount;
  }

  async updateAccount(account: Account): Promise<void> {
    const db = await this.getDb();
    const updatedAccount = {
      ...account,
      balance: account.isDebt ? -Math.abs(account.balance) : Math.abs(account.balance),
    };
    
    await db.updateAccount(updatedAccount);
  }

  async deleteAccount(id: string): Promise<void> {
    const db = await this.getDb();
    await db.deleteAccount(id);
  }
}

// Initialize database service
let dbServiceInstance: Promise<DatabaseService>;

export function getDatabaseService(): Promise<DatabaseService> {
  if (!dbServiceInstance) {
    dbServiceInstance = DatabaseService.getInstance();
  }
  return dbServiceInstance;
}
