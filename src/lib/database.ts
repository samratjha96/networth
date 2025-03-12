import { Account } from "@/components/AccountsList"
import { DatabaseProvider, NetworthHistory } from "@/lib/types"
import { generateMockAccounts, generateMockNetworthHistory } from "@/lib/mock-data"

const STORAGE_KEYS = {
  ACCOUNTS: "networth_accounts",
  HISTORY: "networth_history",
  TEST_MODE: "networth_test_mode",
  LAST_UPDATE: "networth_last_update"
};

// Mock database implementation using localStorage
export class MockDatabase implements DatabaseProvider {
  private static instance: MockDatabase | null = null;
  private testMode: boolean = false;
  private mockAccounts: Account[] | null = null;
  private mockHistory: NetworthHistory[] | null = null;

  static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
      // Initialize storage if empty
      if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, '[]');
      }
      if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, '[]');
      }
      if (!localStorage.getItem(STORAGE_KEYS.LAST_UPDATE)) {
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
      }
      
      // Check if test mode was previously enabled
      if (localStorage.getItem(STORAGE_KEYS.TEST_MODE) === 'true') {
        MockDatabase.instance.enableTestMode();
      }
      
      console.log("Mock database initialized");
    }
    return MockDatabase.instance;
  }

  private getStoredAccounts(): Account[] {
    if (this.testMode && this.mockAccounts) {
      return this.mockAccounts;
    }
    
    const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return stored ? JSON.parse(stored) : [];
  }

  private setStoredAccounts(accounts: Account[]): void {
    if (this.testMode) {
      this.mockAccounts = accounts;
      return;
    }
    
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  private getStoredHistory(): NetworthHistory[] {
    if (this.testMode && this.mockHistory) {
      return this.mockHistory;
    }
    
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return stored ? JSON.parse(stored) : [];
  }

  private setStoredHistory(history: NetworthHistory[]): void {
    if (this.testMode) {
      this.mockHistory = history;
      return;
    }
    
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  private getLastUpdate(): Date {
    const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
    return lastUpdate ? new Date(lastUpdate) : new Date();
  }

  private setLastUpdate(date: Date): void {
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, date.toISOString());
  }

  // Test mode controls
  isTestModeEnabled(): boolean {
    return this.testMode;
  }
  
  enableTestMode(): void {
    this.testMode = true;
    localStorage.setItem(STORAGE_KEYS.TEST_MODE, 'true');
    
    // Generate fresh mock data each time test mode is enabled
    this.mockAccounts = generateMockAccounts();
    this.mockHistory = generateMockNetworthHistory();
    
    console.log("Test mode enabled with mock data");
  }
  
  disableTestMode(): void {
    this.testMode = false;
    localStorage.setItem(STORAGE_KEYS.TEST_MODE, 'false');
    
    // Clear mock data to save memory
    this.mockAccounts = null;
    this.mockHistory = null;
    
    console.log("Test mode disabled");
  }
  
  toggleTestMode(): void {
    if (this.testMode) {
      this.disableTestMode();
    } else {
      this.enableTestMode();
    }
  }

  // For interface compatibility
  async initialize(): Promise<void> {
    console.log("Mock database already initialized");
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

  async insertAccount(accountData: Omit<Account, "id">): Promise<Account> {
    const newAccount: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      balance: accountData.isDebt ? -Math.abs(accountData.balance) : Math.abs(accountData.balance),
    };
    
    const accounts = this.getStoredAccounts();
    this.setStoredAccounts([...accounts, newAccount]);
    await this.updateNetworthSnapshot();
    return newAccount;
  }

  async updateAccount(account: Account): Promise<void> {
    const accounts = this.getStoredAccounts();
    const index = accounts.findIndex(a => a.id === account.id);
    
    if (index === -1) {
      throw new Error(`Account with id ${account.id} not found`);
    }

    const updatedAccount = {
      ...account,
      balance: account.isDebt ? -Math.abs(account.balance) : Math.abs(account.balance),
    };
    accounts[index] = updatedAccount;
    this.setStoredAccounts(accounts);
    await this.updateNetworthSnapshot();
  }

  async deleteAccount(id: string): Promise<void> {
    const accounts = this.getStoredAccounts();
    this.setStoredAccounts(accounts.filter(account => account.id !== id));
    await this.updateNetworthSnapshot();
  }

  private async updateNetworthSnapshot(): Promise<void> {
    if (this.testMode) return; // Skip updates in test mode
    
    const totalNetworth = await this.calculateCurrentNetworth();
    const now = new Date();
    
    // Get last update timestamp
    const lastUpdate = this.getLastUpdate();
    const timeDiff = now.getTime() - lastUpdate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // Store the current time as the last update
    this.setLastUpdate(now);
    
    // Add a new snapshot if it's been at least 1 hour since the last update
    // or if there's no history yet
    const history = this.getStoredHistory();
    if (history.length === 0 || hoursDiff >= 1) {
      await this.addNetworthSnapshot(totalNetworth);
    } else {
      // Update the most recent entry instead of creating a new one
      // This prevents too many data points in short time periods
      const updatedHistory = [...history];
      updatedHistory[updatedHistory.length - 1] = {
        date: now.toISOString(),
        value: totalNetworth
      };
      this.setStoredHistory(updatedHistory);
    }
  }

  // Helper to calculate current net worth
  async calculateCurrentNetworth(): Promise<number> {
    const accounts = await this.getAllAccounts();
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }

  // Networth history operations
  async getNetworthHistory(days: number): Promise<NetworthHistory[]> {
    const history = this.getStoredHistory();
    
    // Special handling for test mode to ensure we always have data with proper time ranges
    if (this.testMode && this.mockHistory && this.mockHistory.length > 0) {
      // If test mode is enabled, we want to ensure we always have enough data points
      // for the requested range to show meaningful variations
      
      // For "ALL", return complete mock history
      if (days === 0) {
        return this.mockHistory;
      }
      
      // For specific ranges, filter by date to get the correct days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Filter mock history to the requested time period
      return this.mockHistory.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }
    
    // Normal behavior for real data
    
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
    // Don't add new snapshots in test mode to preserve the mock data
    if (this.testMode) {
      return;
    }
    
    const history = this.getStoredHistory();
    const newEntry = {
      date: new Date().toISOString(),
      value
    };
    
    // Check if we have an entry from the last hour
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    
    // Find any entries within the last hour
    const recentEntries = history.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= lastHour;
    });
    
    let updatedHistory;
    
    if (recentEntries.length > 0) {
      // Update the most recent entry instead of creating a new one
      updatedHistory = history.map(entry => {
        const entryDate = new Date(entry.date);
        if (entryDate >= lastHour) {
          return newEntry;
        }
        return entry;
      });
    } else {
      // Add a new entry
      updatedHistory = [...history, newEntry];
    }
    
    // Limit the history size to prevent excessive storage
    const MAX_HISTORY_SIZE = 1000; // Adjust as needed
    if (updatedHistory.length > MAX_HISTORY_SIZE) {
      // If we exceed the max size, keep the most recent entries
      updatedHistory = updatedHistory.slice(-MAX_HISTORY_SIZE);
    }
    
    this.setStoredHistory(updatedHistory);
  }

  // Public method to force synchronization of networth history with current account data
  async synchronizeNetworthHistory(): Promise<void> {
    if (this.testMode) return; // Skip in test mode

    const currentNetworth = await this.calculateCurrentNetworth();
    const history = this.getStoredHistory();
    
    if (history.length === 0) {
      // If there's no history, just add the current value
      await this.addNetworthSnapshot(currentNetworth);
      return;
    }
    
    // Update the most recent entry to match the current calculated net worth
    const updatedHistory = [...history];
    updatedHistory[updatedHistory.length - 1] = {
      date: new Date().toISOString(),
      value: currentNetworth
    };
    
    this.setStoredHistory(updatedHistory);
  }
}

// Export initialized instance
export const db = MockDatabase.getInstance();
