import { Account } from "@/components/AccountsList";
import { AccountStorage, DatabaseProvider } from "@/lib/types";
import { db } from "@/lib/database";

// New asynchronous implementation using database
export class DatabaseAccountStorage implements AccountStorage {
  private dbInstance: Promise<DatabaseProvider> = db;

  async getAccounts(): Promise<Account[]> {
    const database = await this.dbInstance;
    return database.getAllAccounts();
  }

  async addAccount(accountData: Omit<Account, "id">): Promise<Account> {
    const database = await this.dbInstance;
    const newAccount: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      balance: accountData.isDebt ? -Math.abs(accountData.balance) : Math.abs(accountData.balance),
    };
    
    await database.insertAccount(newAccount);
    return newAccount;
  }

  async updateAccount(account: Account): Promise<void> {
    const database = await this.dbInstance;
    const updatedAccount = {
      ...account,
      balance: account.isDebt ? -Math.abs(account.balance) : Math.abs(account.balance),
    };
    
    await database.updateAccount(updatedAccount);
  }

  async deleteAccount(id: string): Promise<void> {
    const database = await this.dbInstance;
    await database.deleteAccount(id);
  }
}
