import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Account,
  AccountType,
  CurrencyCode,
  DatabaseProvider,
  NetworthHistory,
} from "@/types";

// Access environment variables using Vite's import.meta.env approach
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isDevelopment = import.meta.env.DEV;
export const useSupabase = import.meta.env.VITE_USE_SUPABASE === "true";

// Fixed test user credentials for development
export const TEST_USER_ID = "0f995af2-0270-4f9d-a9bc-982710f0f467";
const TEST_USER_EMAIL =
  import.meta.env.VITE_SUPABASE_TEST_USER_EMAIL || "test@example.com";
const TEST_USER_PASSWORD =
  import.meta.env.VITE_SUPABASE_TEST_USER_PASSWORD || "testpassword123";

// Type definitions for database tables
type AccountRow = Tables<"accounts">;
type AccountInsert = TablesInsert<"accounts">;
type AccountUpdate = TablesUpdate<"accounts">;
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

const accountToDbAccount = (
  account: Omit<Account, "id">,
  userId: string,
): AccountInsert => {
  const balance = account.isDebt
    ? -Math.abs(account.balance)
    : Math.abs(account.balance);

  return {
    name: account.name,
    type: account.type,
    currency: account.currency,
    balance,
    user_id: userId,
    is_debt: account.isDebt,
  };
};

// Supabase implementation of the DatabaseProvider interface
export class SupabaseDatabase implements DatabaseProvider {
  private static instance: SupabaseDatabase | null = null;
  private supabase: SupabaseClient<Database>;
  private userId: string | null = null;
  private isInitialized: boolean = false;
  private isAuthInitialized: boolean = false;

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

    // In development, automatically set the test user ID
    if (isDevelopment) {
      this.userId = TEST_USER_ID;
      console.log("Using test user ID for development:", TEST_USER_ID);
    }
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

  // Set the current user ID - call this after user authentication
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Get the current user ID or throw if not set
  private getUserId(): string {
    if (isDevelopment && !this.userId) {
      return TEST_USER_ID;
    }

    if (!this.userId) {
      throw new Error(
        "User not authenticated. Call setUserId after authentication.",
      );
    }
    return this.userId;
  }

  // Initialize the database structure
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // In development mode, sign in as test user
    if (isDevelopment && !this.isAuthInitialized) {
      await this.initializeTestAuth();
    }

    console.log("Supabase database client initialized");
    this.isInitialized = true;
  }

  // Sign in as test user for development
  private async initializeTestAuth(): Promise<void> {
    if (this.isAuthInitialized) return;

    // Validate if test credentials are set
    if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
      console.error("❌ Missing test user credentials in .env file!");
      console.error(
        "Please add VITE_SUPABASE_TEST_USER_EMAIL and VITE_SUPABASE_TEST_USER_PASSWORD to your .env file",
      );
      return;
    }

    try {
      console.log("🔑 Initializing auth with test user:", TEST_USER_EMAIL);

      // Check if we're already signed in
      const {
        data: { user },
        error: getUserError,
      } = await this.supabase.auth.getUser();

      if (getUserError) {
        console.error("Error checking current user:", getUserError);
      }

      if (!user) {
        console.log("📝 Signing in as test user...");
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
        });

        if (error) {
          console.error("❌ Error signing in as test user:", error.message);
          // Show more specific errors to help debugging
          if (error.message.includes("Invalid login credentials")) {
            console.error(
              "The email or password is incorrect. Verify your test user credentials in the .env file.",
            );
          } else if (error.message.includes("Email not confirmed")) {
            console.error(
              "Your test user email is not confirmed. Go to Supabase dashboard and confirm it manually.",
            );
          }
          return;
        }

        if (data?.user) {
          console.log(
            "✅ Successfully signed in as test user:",
            data.user.email,
          );
          console.log("🆔 User ID:", data.user.id);
          this.userId = data.user.id;

          // Verify the user ID matches what we expect
          if (data.user.id !== TEST_USER_ID) {
            console.warn(
              "⚠️ Warning: The authenticated user ID does not match TEST_USER_ID in your code!",
            );
            console.warn(`Authenticated as: ${data.user.id}`);
            console.warn(`Expected: ${TEST_USER_ID}`);
            console.warn(
              "Update TEST_USER_ID in supabase-database.ts to match the authenticated user ID.",
            );
          }
        }
      } else {
        console.log("✅ Already signed in as:", user.email);
        console.log("🆔 User ID:", user.id);
        this.userId = user.id;

        // Verify the user ID matches what we expect
        if (user.id !== TEST_USER_ID) {
          console.warn(
            "⚠️ Warning: The authenticated user ID does not match TEST_USER_ID in your code!",
          );
          console.warn(`Authenticated as: ${user.id}`);
          console.warn(`Expected: ${TEST_USER_ID}`);
          console.warn(
            "Update TEST_USER_ID in supabase-database.ts to match the authenticated user ID.",
          );
        }
      }

      this.isAuthInitialized = true;
    } catch (err) {
      console.error("❌ Error initializing test auth:", err);
    }
  }

  async close(): Promise<void> {
    // No explicit close needed for Supabase client
    console.log("Supabase database connection closed");
  }

  // Account operations
  async getAllAccounts(): Promise<Account[]> {
    const userId = this.getUserId();

    const { data, error } = await this.supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching accounts:", error);
      throw error;
    }

    // Map DB rows to Account objects
    return (data || []).map(dbAccountToAccount);
  }

  async getAccount(id: string): Promise<Account | undefined> {
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
      console.error("Error fetching account:", error);
      throw error;
    }

    return data ? dbAccountToAccount(data) : undefined;
  }

  async insertAccount(accountData: Omit<Account, "id">): Promise<Account> {
    const userId = this.getUserId();

    const newAccount = accountToDbAccount(accountData, userId);

    const { data, error } = await this.supabase
      .from("accounts")
      .insert(newAccount)
      .select()
      .single();

    if (error) {
      console.error("Error inserting account:", error);
      throw error;
    }

    const insertedAccount = dbAccountToAccount(data);

    await this.updateNetworthSnapshot();
    return insertedAccount;
  }

  async updateAccount(account: Account): Promise<void> {
    const userId = this.getUserId();

    // Convert to DB format
    const { balance, is_debt, currency, name, type } = accountToDbAccount(
      account,
      userId,
    );

    const updateData: AccountUpdate = {
      name,
      type,
      currency,
      balance,
      is_debt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .from("accounts")
      .update(updateData)
      .eq("id", account.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating account:", error);
      throw error;
    }

    await this.updateNetworthSnapshot();
  }

  async deleteAccount(id: string): Promise<void> {
    const userId = this.getUserId();

    const { error } = await this.supabase
      .from("accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting account:", error);
      throw error;
    }

    await this.updateNetworthSnapshot();
  }

  // Networth history operations
  async getNetworthHistory(days: number): Promise<NetworthHistory[]> {
    const userId = this.getUserId();

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

    if (error) {
      console.error("Error fetching networth history:", error);
      throw error;
    }

    // Transform data to match the expected format, removing user_id
    return data.map((item) => ({
      date: item.date,
      value: item.value,
    }));
  }

  async addNetworthSnapshot(value: number): Promise<void> {
    const userId = this.getUserId();
    const now = new Date().toISOString();

    // Check if we have an entry from the last hour to avoid too many data points
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);

    const { data: recentEntries, error: fetchError } = await this.supabase
      .from("networth_history")
      .select("id")
      .eq("user_id", userId)
      .gte("date", lastHour.toISOString());

    if (fetchError) {
      console.error("Error checking recent history:", fetchError);
      throw fetchError;
    }

    if (recentEntries && recentEntries.length > 0) {
      // Update the most recent entry instead of creating a new one
      const { error } = await this.supabase
        .from("networth_history")
        .update({ date: now, value })
        .eq("id", recentEntries[0].id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating networth history:", error);
        throw error;
      }
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

      if (error) {
        console.error("Error adding networth history:", error);
        throw error;
      }
    }
  }

  private async updateNetworthSnapshot(): Promise<void> {
    const totalNetworth = await this.calculateCurrentNetworth();
    await this.addNetworthSnapshot(totalNetworth);
  }

  // Helper to calculate current net worth
  async calculateCurrentNetworth(): Promise<number> {
    const accounts = await this.getAllAccounts();
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }

  async synchronizeNetworthHistory(): Promise<void> {
    const currentNetworth = await this.calculateCurrentNetworth();
    await this.addNetworthSnapshot(currentNetworth);
  }

  // Test mode methods are not implemented for Supabase
  // as they don't make sense in a production environment
  isTestModeEnabled(): boolean {
    return false; // Supabase implementation always returns false
  }

  setTestMode(enabled: boolean): void {
    if (enabled) {
      console.warn(
        "Test mode is not directly supported in Supabase implementation. The application will switch to the mock database implementation.",
      );
    }
    // No need to do anything here, since the factory handles switching implementations
  }
}

// Export initialized instance
export const supabaseDb = SupabaseDatabase.getInstance();
