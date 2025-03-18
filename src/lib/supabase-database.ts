import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Functions,
} from "@/types/supabase";
import {
  Account,
  AccountType,
  AccountValue,
  AccountWithValue,
} from "@/types/accounts";
import { CurrencyCode } from "@/types/currency";
import { DatabaseProvider } from "@/types/database";
import { NetworthHistory } from "@/types/networth";

// Access environment variables using Vite's import.meta.env approach
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const useSupabase = import.meta.env.VITE_USE_SUPABASE === "true";

// Type definitions for database tables
type AccountRow = Tables<"accounts">;
type AccountInsert = TablesInsert<"accounts">;
type AccountUpdate = TablesUpdate<"accounts">;
type HourlyAccountValueRow = Tables<"hourly_account_values">;
type HourlyAccountValueInsert = TablesInsert<"hourly_account_values">;
type HourlyAccountValueUpdate = TablesUpdate<"hourly_account_values">;
type NetworthHistoryRow = Tables<"networth_history">;
type NetworthHistoryInsert = TablesInsert<"networth_history">;
type NetworthHistoryUpdate = TablesUpdate<"networth_history">;

// Helper functions for converting between database and app types
const dbAccountToAccount = (dbAccount: AccountRow): Account => {
  const { is_debt, user_id, ...rest } = dbAccount;
  return {
    ...rest,
    type: rest.type as AccountType,
    currency: rest.currency as CurrencyCode,
    isDebt: is_debt ?? false,
  };
};

const dbAccountValueToAccountValue = (
  dbValue: HourlyAccountValueRow,
): AccountValue => {
  return {
    accountId: dbValue.account_id,
    hourStart: new Date(dbValue.hour_start),
    value: dbValue.value,
  };
};

const accountToDbAccount = (
  account: Omit<AccountWithValue, "id">,
  userId: string,
): AccountInsert => {
  return {
    name: account.name,
    type: account.type,
    currency: account.currency,
    user_id: userId,
    is_debt: account.isDebt,
  };
};

const valueToDbAccountValue = (
  accountId: string,
  userId: string,
  value: number,
  hourStart?: Date,
): HourlyAccountValueInsert => {
  return {
    account_id: accountId,
    user_id: userId,
    hour_start:
      hourStart?.toISOString() ||
      new Date(Date.now() - (Date.now() % 3600000)).toISOString(),
    value: value,
  };
};

// Common error handler for database operations
type ErrorHandler = <T>(
  operation: string,
  fn: () => Promise<T>,
  defaultValue?: T,
  shouldRethrow?: boolean,
) => Promise<T>;

// Supabase implementation of the DatabaseProvider interface
export class SupabaseDatabase implements DatabaseProvider {
  private static instance: SupabaseDatabase | null = null;
  private supabase: SupabaseClient<Database>;
  private isInitialized: boolean = false;
  private currentUserId: string | null = null;

  private constructor() {
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase URL and key are missing");
      throw new Error(
        "Supabase URL and key must be provided in .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
      );
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      db: {
        schema: "public",
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  // Centralized error handling method to reduce duplication
  private async handleError<T>(
    operation: string,
    fn: () => Promise<T>,
    defaultValue?: T,
    shouldRethrow = true,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(`Error in ${operation}:`, error);
      if (shouldRethrow) throw error;
      return defaultValue as T;
    }
  }

  // Convenience method to check if user is authenticated
  private isAuthenticatedUser(): boolean {
    return !!this.currentUserId;
  }

  static getInstance(): SupabaseDatabase {
    try {
      if (!this.instance) {
        // Check if credentials are available before creating an instance
        if (!supabaseUrl || !supabaseKey) {
          console.warn("Supabase credentials missing, returning null instance");
          return null;
        }
        this.instance = new SupabaseDatabase();
      }
      return this.instance;
    } catch (error) {
      console.error("Error creating Supabase instance:", error);
      return null;
    }
  }

  // Set the current user ID - called from outside
  setUserId(userId: string | null): void {
    // Check if user ID has changed
    if (this.currentUserId !== userId) {
      console.debug(`Changing user ID from ${this.currentUserId} to ${userId}`);
      this.currentUserId = userId;

      // Reset initialized state so we reinitialize with the new user
      if (userId !== null) {
        this.isInitialized = false;
      }
    }
  }

  // Check if a user ID is available and valid
  hasUserId(): boolean {
    return this.isAuthenticatedUser();
  }

  // Get the current user ID or throw if not set
  private getUserId(): string {
    if (!this.currentUserId) {
      throw new Error("User not authenticated. No user ID available.");
    }
    return this.currentUserId;
  }

  // Initialize the database structure
  async initialize(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      console.debug("Supabase database already initialized, skipping");
      return;
    }

    console.debug("Initializing Supabase database");

    try {
      // Check if we have a valid user ID
      if (!this.hasUserId()) {
        console.debug(
          "No user ID available for Supabase database, initialization skipped",
        );
        this.isInitialized = true;
        return;
      }

      // Verify that we have a valid user ID
      const userId = this.getUserId();
      console.debug("Initializing database with user ID:", userId);

      try {
        // Test connection by fetching a single account - this confirms database access
        const { data, error } = await this.supabase
          .from("accounts")
          .select("id")
          .eq("user_id", userId)
          .limit(1);

        if (error) {
          console.error("Error testing database connection:", error);
          throw error;
        }

        console.debug("Supabase database connection test successful:", {
          userId,
          accountsFound: data?.length ?? 0,
        });
      } catch (connectionError) {
        console.error("Database connection test failed:", connectionError);
        // Still mark as initialized to prevent repeated failures
        // But log the error for debugging
      }

      console.debug("Supabase database initialized successfully");
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Supabase database:", error);
      // Still mark as initialized to prevent repeated failures
      // But log the error for debugging
      this.isInitialized = true;
    }
  }

  async close(): Promise<void> {
    // No explicit close needed for Supabase client
    console.log("Supabase database connection closed");
  }

  // Account operations
  async getAllAccounts(): Promise<AccountWithValue[]> {
    return this.handleError(
      "getAllAccounts",
      async () => {
        const userId = this.getUserId();

        // Get all accounts
        const { data: accountsData, error: accountsError } = await this.supabase
          .from("accounts")
          .select("*")
          .eq("user_id", userId);

        if (accountsError) throw accountsError;

        const accounts = (accountsData || []).map(dbAccountToAccount);

        // Get current value for each account
        const accountsWithValues = await Promise.all(
          accounts.map(async (account) => {
            const value = await this.getAccountValue(account.id);
            return {
              ...account,
              balance: value,
            };
          }),
        );

        return accountsWithValues;
      },
      [], // default empty array if error
      false, // don't rethrow
    );
  }

  async getAccount(id: string): Promise<AccountWithValue | undefined> {
    return this.handleError(
      "getAccount",
      async () => {
        const userId = this.getUserId();

        const { data, error } = await this.supabase
          .from("accounts")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // Record not found error code
            return undefined;
          }
          throw error;
        }

        if (!data) return undefined;

        const account = dbAccountToAccount(data);
        const value = await this.getAccountValue(id);

        return {
          ...account,
          balance: value,
        };
      },
      undefined, // default value
      false, // don't rethrow
    );
  }

  async insertAccount(
    accountData: Omit<AccountWithValue, "id">,
  ): Promise<AccountWithValue> {
    return this.handleError("insertAccount", async () => {
      const userId = this.getUserId();

      // Insert account metadata
      const newAccount = accountToDbAccount(accountData, userId);
      const { data, error } = await this.supabase
        .from("accounts")
        .insert(newAccount)
        .select()
        .single();

      if (error) throw error;

      // Insert initial account value
      const accountId = data.id;
      const valueToInsert = accountData.isDebt
        ? -Math.abs(accountData.balance)
        : Math.abs(accountData.balance);

      const accountValueData = valueToDbAccountValue(
        accountId,
        userId,
        valueToInsert,
      );

      const { error: valueError } = await this.supabase
        .from("hourly_account_values")
        .insert(accountValueData);

      if (valueError) throw valueError;

      const insertedAccount = dbAccountToAccount(data);
      await this.updateNetworthSnapshot();

      return {
        ...insertedAccount,
        balance: accountData.balance,
      };
    });
  }

  async updateAccount(account: AccountWithValue): Promise<void> {
    return this.handleError("updateAccount", async () => {
      const userId = this.getUserId();

      // Update account metadata
      const updateData: AccountUpdate = {
        name: account.name,
        type: account.type,
        currency: account.currency,
        is_debt: account.isDebt,
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from("accounts")
        .update(updateData)
        .eq("id", account.id)
        .eq("user_id", userId);

      if (error) throw error;

      // Insert new account value
      const valueToInsert = account.isDebt
        ? -Math.abs(account.balance)
        : Math.abs(account.balance);

      const accountValueData = valueToDbAccountValue(
        account.id,
        userId,
        valueToInsert,
      );

      // First check if a value exists for this hour
      const hourStart = new Date(Date.now() - (Date.now() % 3600000));
      const { data: existingData, error: fetchError } = await this.supabase
        .from("hourly_account_values")
        .select("*")
        .eq("account_id", account.id)
        .eq("hour_start", hourStart.toISOString());

      if (fetchError) throw fetchError;

      // If value exists, update it, otherwise insert new
      if (existingData && existingData.length > 0) {
        const { error: updateError } = await this.supabase
          .from("hourly_account_values")
          .update({ value: valueToInsert })
          .eq("account_id", account.id)
          .eq("hour_start", hourStart.toISOString());

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await this.supabase
          .from("hourly_account_values")
          .insert(accountValueData);

        if (insertError) throw insertError;
      }

      await this.updateNetworthSnapshot();
    });
  }

  async deleteAccount(id: string): Promise<void> {
    return this.handleError("deleteAccount", async () => {
      const userId = this.getUserId();

      // Due to cascade delete, this will also delete related hourly_account_values
      const { error } = await this.supabase
        .from("accounts")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;

      await this.updateNetworthSnapshot();
    });
  }

  // New method to get the current value of an account
  async getAccountValue(accountId: string): Promise<number> {
    return this.handleError(
      "getAccountValue",
      async () => {
        // Call the database function get_current_account_value
        const { data, error } = await this.supabase.rpc(
          "get_current_account_value",
          {
            account_id_param: accountId,
          },
        );

        if (error) throw error;

        return data ?? 0;
      },
      0, // default to 0 if error
      false, // don't rethrow
    );
  }

  // New method to get account value history
  async getAccountValueHistory(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AccountValue[]> {
    return this.handleError(
      "getAccountValueHistory",
      async () => {
        const userId = this.getUserId();

        // Format dates in ISO format without milliseconds to prevent URL encoding issues
        const formattedStartDate = startDate.toISOString().split('.')[0]+'Z';
        const formattedEndDate = endDate.toISOString().split('.')[0]+'Z';
        
        console.debug('Fetching account value history with date range:', {
          start: formattedStartDate,
          end: formattedEndDate,
          accountId
        });

        const { data, error } = await this.supabase
          .from("hourly_account_values")
          .select("*")
          .eq("account_id", accountId)
          .eq("user_id", userId)
          .gte("hour_start", formattedStartDate)
          .lte("hour_start", formattedEndDate)
          .order("hour_start", { ascending: true });

        if (error) {
          console.error('Error fetching account value history:', error);
          throw error;
        }

        return (data || []).map(dbAccountValueToAccountValue);
      },
      [], // default empty array if error
      false, // don't rethrow
    );
  }

  // Networth history operations
  async getNetworthHistory(days: number): Promise<NetworthHistory[]> {
    return this.handleError(
      "getNetworthHistory",
      async () => {
        const userId = this.getUserId();
        console.debug("Fetching networth history from Supabase:", {
          userId,
          days,
        });

        let query = this.supabase
          .from("networth_history")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: true });

        // Filter by days if specified
        if (days > 0) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          query = query.gte("date", startDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        console.debug("Received networth history:", {
          count: data?.length ?? 0,
        });

        // Transform data to match the expected format, removing user_id
        return (data || []).map((item) => ({
          date: item.date,
          value: item.value,
        }));
      },
      [], // default empty array
      false, // don't rethrow
    );
  }

  async addNetworthSnapshot(value: number): Promise<void> {
    return this.handleError(
      "addNetworthSnapshot",
      async () => {
        const userId = this.getUserId();
        const now = new Date().toISOString();

        // Check if user is authenticated - important to prevent operations after sign-out
        if (!this.isAuthenticatedUser()) {
          console.debug("Skipping networth snapshot - no authenticated user");
          return;
        }

        // First check if we have any history at all
        const { data: historyExists, error: checkError } = await this.supabase
          .from("networth_history")
          .select("id")
          .eq("user_id", userId)
          .limit(1);

        if (checkError) throw checkError;

        // If no history exists, create first entry
        if (!historyExists || historyExists.length === 0) {
          const newHistoryEntry: NetworthHistoryInsert = {
            user_id: userId,
            date: now,
            value,
          };

          const { error } = await this.supabase
            .from("networth_history")
            .insert(newHistoryEntry);

          if (error) throw error;
          return;
        }

        // Check if we have an entry from the last hour
        const lastHour = new Date();
        lastHour.setHours(lastHour.getHours() - 1);

        const { data: recentEntries, error: fetchError } = await this.supabase
          .from("networth_history")
          .select("id")
          .eq("user_id", userId)
          .gte("date", lastHour.toISOString())
          .order("date", { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        if (recentEntries && recentEntries.length > 0) {
          // Update the most recent entry instead of creating a new one
          const { error } = await this.supabase
            .from("networth_history")
            .update({ date: now, value })
            .eq("id", recentEntries[0].id)
            .eq("user_id", userId);

          if (error) throw error;
        } else {
          // Add a new entry
          const newHistoryEntry: NetworthHistoryInsert = {
            user_id: userId,
            date: now,
            value,
          };

          const { error } = await this.supabase
            .from("networth_history")
            .insert(newHistoryEntry);

          if (error) throw error;
        }
      },
      undefined,
      false, // don't rethrow
    );
  }

  private async updateNetworthSnapshot(): Promise<void> {
    if (!this.isAuthenticatedUser()) {
      console.debug("Skipping updateNetworthSnapshot - no authenticated user");
      return;
    }

    const totalNetworth = await this.calculateCurrentNetworth();
    await this.addNetworthSnapshot(totalNetworth);
  }

  // Helper to calculate current net worth
  async calculateCurrentNetworth(): Promise<number> {
    const accounts = await this.getAllAccounts();

    return accounts.reduce((total, account) => {
      const value = account.balance;
      return total + (account.isDebt ? -value : value);
    }, 0);
  }

  async synchronizeNetworthHistory(): Promise<void> {
    return this.handleError(
      "synchronizeNetworthHistory",
      async () => {
        if (!this.isAuthenticatedUser()) {
          console.debug(
            "Skipping synchronizeNetworthHistory - no authenticated user",
          );
          return;
        }

        console.log(
          "Synchronizing networth history for user:",
          this.currentUserId,
        );
        const currentNetworth = await this.calculateCurrentNetworth();
        console.log("Current networth calculated:", currentNetworth);
        await this.addNetworthSnapshot(currentNetworth);
        console.log("Networth snapshot added successfully");
      },
      undefined,
      false,
    );
  }

  // Test mode methods are not implemented for Supabase
  // as they don't make sense in a production environment
  isTestModeEnabled(): boolean {
    return false; // Supabase implementation always returns false
  }

  /**
   * Gets account performance data based on historical records
   * @param account The account to get performance data for
   * @param days Number of days to look back for history
   * @returns Object containing current balance, previous balance and timestamps
   * @deprecated Use getAccountValueHistory or getAccountsPerformanceData instead
   */
  async getAccountHistoricalData(
    account: AccountWithValue,
    days: number,
  ): Promise<{
    currentBalance: number;
    previousBalance: number;
    currentDate: string;
    previousDate: string;
  } | null> {
    console.warn(
      "getAccountHistoricalData is deprecated. Use getAccountValueHistory or getAccountsPerformanceData instead.",
    );
    return this.handleError(
      "getAccountHistoricalData",
      async () => {
        // This method is deprecated since we now use hourly_account_values
        // Just return the current values to maintain compatibility with old code
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return {
          currentBalance: account.balance,
          previousBalance: account.balance,
          currentDate: now.toISOString(),
          previousDate: startDate.toISOString(),
        };
      },
      null,
      false,
    );
  }

  /**
   * Gets bulk account history data for multiple accounts in a single query
   * @param accountIds List of account IDs to fetch history for
   * @param days Number of days to look back for history
   * @returns Map of account ID to historical data
   */
  private async getBulkAccountHistory(
    accounts: AccountWithValue[],
    days: number,
  ): Promise<
    Map<
      string,
      {
        currentBalance: number;
        previousBalance: number;
        currentDate: string;
        previousDate: string;
      } | null
    >
  > {
    try {
      if (!accounts.length) return new Map();
      const userId = this.getUserId();

      // Calculate date ranges
      const now = new Date();
      const endDate = new Date(now);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);

      // Start with a map of account IDs to current balances
      const resultMap = new Map<
        string,
        {
          currentBalance: number;
          previousBalance: number;
          currentDate: string;
          previousDate: string;
        } | null
      >();

      // Initialize with current balances
      accounts.forEach((account) => {
        resultMap.set(account.id, {
          currentBalance: account.balance,
          previousBalance: account.balance, // Will be updated with historical value
          currentDate: now.toISOString(),
          previousDate: startDate.toISOString(),
        });
      });

      // Fetch historical values for accounts
      const accountIds = accounts.map((a) => a.id);

      // Format dates in ISO format without milliseconds to prevent URL encoding issues
      const formattedStartDate = startDate.toISOString().split('.')[0]+'Z';
      const formattedEndDate = endDate.toISOString().split('.')[0]+'Z';
      
      console.debug('Fetching account history with date range:', {
        start: formattedStartDate,
        end: formattedEndDate,
        accountCount: accountIds.length
      });

      // Query first for the historical values
      const { data: historyData, error: historyError } = await this.supabase
        .from("hourly_account_values")
        .select("account_id, hour_start, value")
        .in("account_id", accountIds)
        .eq("user_id", userId)
        .gte("hour_start", formattedStartDate)
        .lte("hour_start", formattedEndDate)
        .order("hour_start", { ascending: true });

      if (historyError) {
        console.error('Error fetching hourly account values:', historyError);
        throw historyError;
      }

      if (historyData && historyData.length > 0) {
        // Group by account_id
        const groupedData = historyData.reduce(
          (acc, item) => {
            if (!acc[item.account_id]) {
              acc[item.account_id] = [];
            }
            acc[item.account_id].push(item);
            return acc;
          },
          {} as Record<string, any[]>,
        );

        // For each account, find the earliest value (closest to startDate)
        for (const accountId of accountIds) {
          const accountHistory = groupedData[accountId];

          if (accountHistory && accountHistory.length > 0) {
            // Sort by date ascending to get earliest first
            accountHistory.sort(
              (a, b) =>
                new Date(a.hour_start).getTime() -
                new Date(b.hour_start).getTime(),
            );

            const earliestRecord = accountHistory[0];
            const result = resultMap.get(accountId);

            if (result) {
              result.previousBalance = earliestRecord.value;
              result.previousDate = earliestRecord.hour_start;
            }
          }
        }
      }

      return resultMap;
    } catch (error) {
      console.error("Error in getBulkAccountHistory:", error);
      return new Map();
    }
  }

  /**
   * Gets performance data for multiple accounts based on historical records
   * @param accounts List of accounts to get performance data for
   * @param days Number of days to look back for history
   * @returns Array of account performance metrics
   */
  async getAccountsPerformanceData(
    accounts: AccountWithValue[],
    days: number,
  ): Promise<
    {
      id: string;
      name: string;
      type: string;
      currentBalance: number;
      previousBalance: number;
      changeAmount: number;
      changePercentage: number;
      isDebt: boolean;
    }[]
  > {
    try {
      const historyMap = await this.getBulkAccountHistory(accounts, days);

      return accounts.map((account) => {
        const history = historyMap.get(account.id);

        // Assuming no history was found, default to current value
        if (!history) {
          return {
            id: account.id,
            name: account.name,
            type: account.type,
            currentBalance: account.balance,
            previousBalance: account.balance,
            changeAmount: 0,
            changePercentage: 0,
            isDebt: account.isDebt || false,
          };
        }

        const { currentBalance, previousBalance } = history;
        const changeAmount = currentBalance - previousBalance;
        let changePercentage = 0;

        if (previousBalance !== 0) {
          changePercentage = (changeAmount / Math.abs(previousBalance)) * 100;
        } else if (currentBalance !== 0) {
          // If previous balance was 0, but current is not, it's a special case
          changePercentage = currentBalance > 0 ? 100 : -100;
        }

        return {
          id: account.id,
          name: account.name,
          type: account.type,
          currentBalance,
          previousBalance,
          changeAmount,
          changePercentage,
          isDebt: account.isDebt || false,
        };
      });
    } catch (error) {
      console.error("Error calculating account performance:", error);
      return [];
    }
  }

  // Cleanup resources when switching database providers
  cleanup(): void {
    console.log("Cleaning up Supabase database resources");
    // Reset user context
    this.currentUserId = null;
    // Reset initialization flag
    this.isInitialized = false;
  }
}

// Export initialized instance
export const supabaseDb = SupabaseDatabase.getInstance();
