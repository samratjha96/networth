import { Account } from "@/components/AccountsList";
import { DatabaseProvider, NetworthHistory } from "@/lib/types";

/**
 * Abstract base class for database implementations
 * Contains common functionality that can be shared across implementations
 */
export abstract class BaseDatabase implements DatabaseProvider {
  protected isInitialized: boolean = false;
  protected testMode: boolean = false;
  
  // Abstract methods that must be implemented by subclasses
  abstract initialize(): Promise<void>;
  abstract close(): Promise<void>;
  
  // Account operations
  abstract getAllAccounts(): Promise<Account[]>;
  abstract getAccount(id: string): Promise<Account | undefined>;
  abstract insertAccount(accountData: Omit<Account, "id">): Promise<Account>;
  abstract updateAccount(account: Account): Promise<void>;
  abstract deleteAccount(id: string): Promise<void>;
  
  // Networth history operations
  abstract getNetworthHistory(days: number): Promise<NetworthHistory[]>;
  abstract addNetworthSnapshot(value: number): Promise<void>;
  
  // Test mode operations - may be overridden by subclasses if needed
  isTestModeEnabled(): boolean {
    return this.testMode;
  }
  
  setTestMode(enabled: boolean): void {
    this.testMode = enabled;
    console.log(`Test mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  // Common functionality
  async synchronizeNetworthHistory(): Promise<void> {
    // Default implementation that can be overridden
    const networth = await this.calculateCurrentNetworth();
    await this.addNetworthSnapshot(networth);
  }
  
  async calculateCurrentNetworth(): Promise<number> {
    const accounts = await this.getAllAccounts();
    return accounts.reduce((total, account) => total + account.balance, 0);
  }
  
  // Helper method to get currency totals grouped by type
  async getAccountBalancesByType(): Promise<Record<string, number>> {
    const accounts = await this.getAllAccounts();
    const balancesByType: Record<string, number> = {};
    
    for (const account of accounts) {
      const type = account.type;
      if (!balancesByType[type]) {
        balancesByType[type] = 0;
      }
      balancesByType[type] += account.balance;
    }
    
    return balancesByType;
  }
} 