import { Account } from "@components/AccountsList";
import { AccountStorage } from "./types";

const STORAGE_KEY = "networth_accounts";

export class LocalAccountStorage implements AccountStorage {
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
      // Ensure debt accounts have negative balance
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
      // Ensure debt accounts have negative balance
      balance: account.isDebt ? -Math.abs(account.balance) : Math.abs(account.balance),
    };
    
    this.setStoredAccounts(accounts);
  }

  deleteAccount(id: string): void {
    const accounts = this.getStoredAccounts();
    this.setStoredAccounts(accounts.filter((account) => account.id !== id));
  }
}
