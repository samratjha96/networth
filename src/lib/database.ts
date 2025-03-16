import { Account } from "@/types/accounts";
import { DatabaseProvider } from "@/types/database";
import { NetworthHistory } from "@/types/networth";
import {
  generateMockAccounts,
  generateMockNetworthHistory,
} from "@/lib/mock-data";

const STORAGE_KEYS = {
  ACCOUNTS: "networth_accounts",
  HISTORY: "networth_history",
  TEST_MODE: "networth_test_mode",
  LAST_UPDATE: "networth_last_update",
};

// Mock database implementation using localStorage
export class MockDatabase implements DatabaseProvider {
  private static instance: MockDatabase | null = null;
  private testMode: boolean = false;
  private mockAccounts: Account[] | null = null;
  private mockHistory: NetworthHistory[] | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
      MockDatabase.instance.initializeInternal();
    }
    return MockDatabase.instance;
  }

  private initializeInternal(): void {
    if (this.isInitialized) return;

    // Initialize storage if empty
    if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, "[]");
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, "[]");
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAST_UPDATE)) {
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
    }

    // Check if test mode was previously enabled
    const savedTestMode =
      localStorage.getItem(STORAGE_KEYS.TEST_MODE) === "true";
    this.testMode = savedTestMode;

    if (savedTestMode) {
      // Generate new mock data on every page load when in test mode
      this.mockAccounts = generateMockAccounts();
      const startValue = this.mockAccounts.reduce(
        (sum, account) => sum + account.balance,
        0,
      );
      this.mockHistory = generateMockNetworthHistory(startValue);
      console.log(
        "Mock database initialized in TEST MODE with fresh mock data",
      );
    } else {
      console.log("Mock database initialized in REGULAR mode");
    }

    this.isInitialized = true;
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

  // Helper to restore or generate mock data
  private restoreOrGenerateMockData(): void {
    // Don't set testMode again as it should already be set
    // this.testMode = true;

    // Always generate fresh mock data for demo mode on every page load
    this.mockAccounts = generateMockAccounts();
    const startValue = this.mockAccounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );
    this.mockHistory = generateMockNetworthHistory(startValue);

    // We don't store the mock data in localStorage anymore
    // to ensure we get different data on every refresh
  }

  // Enable/disable test mode
  setTestMode(enabled: boolean): void {
    const wasEnabled = this.testMode;
    this.testMode = enabled;
    localStorage.setItem(STORAGE_KEYS.TEST_MODE, enabled.toString());

    if (enabled && !wasEnabled) {
      // Always generate fresh mock data when enabling test mode
      this.restoreOrGenerateMockData();
    } else if (!enabled) {
      // Clear mock data when disabling test mode
      this.mockAccounts = null;
      this.mockHistory = null;
    }
  }

  // For interface compatibility
  async initialize(): Promise<void> {
    // This is called externally, but we've already initialized in getInstance
    if (!this.isInitialized) {
      this.initializeInternal();
    }
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
    return accounts.find((account) => account.id === id);
  }

  async insertAccount(accountData: Omit<Account, "id">): Promise<Account> {
    const newAccount: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      balance: accountData.isDebt
        ? -Math.abs(accountData.balance)
        : Math.abs(accountData.balance),
    };

    const accounts = this.getStoredAccounts();
    this.setStoredAccounts([...accounts, newAccount]);
    await this.updateNetworthSnapshot();
    return newAccount;
  }

  async updateAccount(account: Account): Promise<void> {
    const accounts = this.getStoredAccounts();
    const index = accounts.findIndex((a) => a.id === account.id);

    if (index === -1) {
      throw new Error(`Account with id ${account.id} not found`);
    }

    const updatedAccount = {
      ...account,
      balance: account.isDebt
        ? -Math.abs(account.balance)
        : Math.abs(account.balance),
    };
    accounts[index] = updatedAccount;
    this.setStoredAccounts(accounts);

    // Also update history in test mode to reflect the new balance
    if (this.testMode && this.mockHistory && this.mockHistory.length > 0) {
      const newNetWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      // Update the latest mock history entry
      const lastEntry = this.mockHistory[this.mockHistory.length - 1];
      lastEntry.value = newNetWorth;
    }

    await this.updateNetworthSnapshot();
  }

  async deleteAccount(id: string): Promise<void> {
    const accounts = this.getStoredAccounts();
    this.setStoredAccounts(accounts.filter((account) => account.id !== id));
    await this.updateNetworthSnapshot();
  }

  private async updateNetworthSnapshot(): Promise<void> {
    const totalNetworth = await this.calculateCurrentNetworth();
    const now = new Date();

    // Handle test mode differently instead of skipping entirely
    if (this.testMode) {
      if (this.mockHistory && this.mockHistory.length > 0) {
        // Update the last entry in mock history
        this.mockHistory[this.mockHistory.length - 1] = {
          date: now.toISOString(),
          value: totalNetworth,
        };
      }
      return;
    }

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
        value: totalNetworth,
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
    const currentNetWorth = await this.calculateCurrentNetworth();
    const today = new Date();

    // Special handling for test mode to ensure we always have data with proper time ranges
    if (this.testMode && this.mockHistory && this.mockHistory.length > 0) {
      // For "ALL", return complete mock history
      if (days === 0) {
        const result = [...this.mockHistory];
        // Ensure the last point matches current net worth
        if (result.length > 0) {
          result[result.length - 1] = {
            date: today.toISOString(),
            value: currentNetWorth,
          };
        }
        return result;
      }

      // For specific ranges, filter by date to get the correct days
      const endDate = today;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Filter mock history to the requested time period and ensure proper sorting
      const filteredHistory = this.mockHistory
        .filter((entry) => {
          const entryDate = new Date(entry.date);
          return entryDate >= startDate && entryDate <= endDate;
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      // Return filtered history if we have enough points
      if (filteredHistory.length >= 2) {
        // Ensure the last point matches current net worth
        if (filteredHistory.length > 0) {
          // Replace the last entry with today's date and current net worth
          filteredHistory[filteredHistory.length - 1] = {
            date: today.toISOString(),
            value: currentNetWorth,
          };
        }
        return filteredHistory;
      }

      // If we don't have enough points, use the closest available data point
      const lastAvailablePoint = this.mockHistory[this.mockHistory.length - 1];
      const newHistory: NetworthHistory[] = [];
      const currentDate = new Date(startDate);

      while (currentDate < endDate) {
        newHistory.push({
          date: currentDate.toISOString(),
          value: lastAvailablePoint.value,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Add today's value as the last point
      newHistory.push({
        date: today.toISOString(),
        value: currentNetWorth,
      });

      return newHistory;
    }

    // Normal behavior for real data

    // For "ALL", return complete history
    if (days === 0) {
      const result = [...history];
      // Ensure the last point matches current net worth
      if (result.length > 0) {
        result[result.length - 1] = {
          date: today.toISOString(),
          value: currentNetWorth,
        };
      }
      return result;
    }

    // For specific ranges, filter by date
    const endDate = today;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const filteredHistory = history.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Ensure the last point matches current net worth
    if (filteredHistory.length > 0) {
      filteredHistory[filteredHistory.length - 1] = {
        date: today.toISOString(),
        value: currentNetWorth,
      };
    } else if (filteredHistory.length === 0 && history.length > 0) {
      // If we filtered out all entries, at least include the current value
      filteredHistory.push({
        date: today.toISOString(),
        value: currentNetWorth,
      });
    }

    return filteredHistory;
  }

  async addNetworthSnapshot(value: number): Promise<void> {
    // Don't add new snapshots in test mode to preserve the mock data
    if (this.testMode) {
      return;
    }

    const history = this.getStoredHistory();
    const newEntry = {
      date: new Date().toISOString(),
      value,
    };

    // Check if we have an entry from the last hour
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);

    // Find any entries within the last hour
    const recentEntries = history.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= lastHour;
    });

    let updatedHistory;

    if (recentEntries.length > 0) {
      // Update the most recent entry instead of creating a new one
      updatedHistory = history.map((entry) => {
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
    const currentNetworth = await this.calculateCurrentNetworth();

    if (this.testMode) {
      // Update test mode history if it exists
      if (this.mockHistory && this.mockHistory.length > 0) {
        // Update the most recent entry to reflect current net worth
        this.mockHistory[this.mockHistory.length - 1] = {
          date: new Date().toISOString(),
          value: currentNetworth,
        };
      }
      return;
    }

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
      value: currentNetworth,
    };

    this.setStoredHistory(updatedHistory);
  }

  // Generate 60 days of mock data with hourly intervals
  generateHourlyMockData(): void {
    // Check if mock data already exists
    const existingHistory = this.getStoredHistory();
    if (existingHistory.length > 0) return; // Exit if data already exists

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    const mockData: NetworthHistory[] = [];

    // Start with a base value and add realistic fluctuations
    let baseValue = 5000 + Math.random() * 5000; // Random starting value between 5000-10000
    const currentDate = new Date(startDate);

    while (currentDate <= now) {
      // Add some realistic fluctuations
      // Small hourly changes (0.1% - 0.5%)
      const hourlyChange =
        baseValue *
        (0.001 + Math.random() * 0.004) *
        (Math.random() > 0.5 ? 1 : -1);

      // Larger daily changes (0.5% - 2%)
      const dailyChange =
        baseValue *
        (0.005 + Math.random() * 0.015) *
        (Math.random() > 0.5 ? 1 : -1);

      // Weekly trend (1% - 5%)
      const weeklyTrend =
        baseValue *
        (0.01 + Math.random() * 0.04) *
        (Math.random() > 0.6 ? 1 : -1);

      // Apply changes based on time
      const hour = currentDate.getHours();
      const day = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

      // More activity during business hours
      const timeMultiplier = hour >= 9 && hour <= 17 ? 1.2 : 0.8;

      // Less activity on weekends
      const dayMultiplier = day === 0 || day === 6 ? 0.7 : 1.0;

      // Calculate the value change
      let valueChange = hourlyChange * timeMultiplier * dayMultiplier;

      // Apply daily change at the start of each day
      if (hour === 0) {
        valueChange += dailyChange;
      }

      // Apply weekly trend at the start of each week
      if (day === 1 && hour === 0) {
        valueChange += weeklyTrend;
      }

      // Update the base value
      baseValue += valueChange;

      // Ensure value doesn't go below 1000
      baseValue = Math.max(1000, baseValue);

      mockData.push({
        date: currentDate.toISOString(),
        value: Math.round(baseValue * 100) / 100, // Round to 2 decimal places
      });

      // Move to next hour
      currentDate.setHours(currentDate.getHours() + 1);
    }

    console.log(`Generated ${mockData.length} hourly data points for 60 days`);
    this.setStoredHistory(mockData);
  }

  // Public method to initialize mock data for the chart
  initializeMockDataForChart(): void {
    this.generateHourlyMockData();
  }
}

// Export initialized instance
export const db = MockDatabase.getInstance();
