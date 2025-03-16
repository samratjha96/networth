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

// Fixed test user credentials for development - only used if no authenticated user
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
  private isInitialized: boolean = false;
  private isAuthInitialized: boolean = false;
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
    this.currentUserId = userId;
  }

  // Check if a user ID is available
  hasUserId(): boolean {
    return !!this.currentUserId;
  }

  // Get the current user ID or throw if not set
  private getUserId(): string {
    if (!this.currentUserId) {
      // In development mode with explicit test credentials, we can use anonymous mode
      if (isDevelopment && TEST_USER_EMAIL && TEST_USER_PASSWORD) {
        console.warn("No user ID set, using anonymous mode in development");
        return "anonymous-user";
      }

      // Otherwise, throw an error - operations requiring a user ID should not proceed
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
      // In development mode, sign in as test user only if no user is set
      if (isDevelopment && !this.hasUserId() && !this.isAuthInitialized) {
        await this.initializeTestAuth();
      }

      // Check if we have a user ID
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

  // Sign in as test user for development
  private async initializeTestAuth(): Promise<void> {
    // Prevent multiple auth initializations
    if (this.isAuthInitialized) {
      console.debug("Test auth already initialized, skipping");
      return;
    }

    // Skip if we already have a user ID (real authentication)
    if (this.hasUserId()) {
      console.debug("Real user already authenticated, skipping test auth");
      this.isAuthInitialized = true;
      return;
    }

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

      // First, try to get the session directly instead of user
      const { data: sessionData, error: sessionError } =
        await this.supabase.auth.getSession();

      // If we have a session with a user, use that
      if (sessionData?.session?.user) {
        console.log(
          "✅ Found existing session with user:",
          sessionData.session.user.email,
        );
        console.log("🆔 User ID:", sessionData.session.user.id);
        // Store the user ID locally
        this.setUserId(sessionData.session.user.id);
        this.isAuthInitialized = true;
        return;
      }

      // If there's an error getting the session or no user in session, try to sign in
      if (sessionError || !sessionData?.session?.user) {
        if (sessionError) {
          console.log(
            "Session error, attempting to sign in:",
            sessionError.message,
          );
        } else {
          console.log("No active session, attempting to sign in as test user");
        }

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
          // Store the user ID locally
          this.setUserId(data.user.id);
        }
      }

      this.isAuthInitialized = true;
    } catch (err) {
      console.error("❌ Error initializing test auth:", err);
      // Still mark as initialized to prevent repeated failures
      this.isAuthInitialized = true;
    }
  }

  async close(): Promise<void> {
    // No explicit close needed for Supabase client
    console.log("Supabase database connection closed");
  }

  // Account operations
  async getAllAccounts(): Promise<Account[]> {
    try {
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
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      // Return empty array instead of throwing to avoid breaking the UI
      return [];
    }
  }

  async getAccount(id: string): Promise<Account | undefined> {
    try {
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
    } catch (error) {
      console.error("Error in getAccount:", error);
      return undefined;
    }
  }

  async insertAccount(accountData: Omit<Account, "id">): Promise<Account> {
    try {
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
    } catch (error) {
      console.error("Error in insertAccount:", error);
      throw error;
    }
  }

  async updateAccount(account: Account): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error in updateAccount:", error);
      throw error;
    }
  }

  async deleteAccount(id: string): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error in deleteAccount:", error);
      throw error;
    }
  }

  // Networth history operations
  async getNetworthHistory(days: number): Promise<NetworthHistory[]> {
    try {
      const userId = this.getUserId();
      console.debug("Fetching networth history from Supabase:", {
        userId,
        days,
      });

      if (!userId) {
        console.error("No user ID available for networth history fetch");
        return [];
      }

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

      console.debug("Received networth history:", { count: data?.length ?? 0 });

      // Transform data to match the expected format, removing user_id
      return (data || []).map((item) => ({
        date: item.date,
        value: item.value,
      }));
    } catch (error) {
      console.error("Error in getNetworthHistory:", error);
      return [];
    }
  }

  async addNetworthSnapshot(value: number): Promise<void> {
    try {
      const userId = this.getUserId();
      const now = new Date().toISOString();

      // Check if user is authenticated - important to prevent operations after sign-out
      if (!this.hasUserId()) {
        console.debug("Skipping networth snapshot - no authenticated user");
        return;
      }

      // First check if we have any history at all
      const { data: historyExists, error: checkError } = await this.supabase
        .from("networth_history")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (checkError) {
        console.error("Error checking history existence:", checkError);
        throw checkError;
      }

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

        if (error) {
          console.error("Error adding initial networth history:", error);
          throw error;
        }
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
    } catch (error) {
      console.error("Error in addNetworthSnapshot:", error);
      // Don't rethrow - this shouldn't break the user experience
    }
  }

  private async updateNetworthSnapshot(): Promise<void> {
    if (!this.hasUserId()) {
      console.debug("Skipping updateNetworthSnapshot - no authenticated user");
      return;
    }
    const totalNetworth = await this.calculateCurrentNetworth();
    await this.addNetworthSnapshot(totalNetworth);
  }

  // Helper to calculate current net worth
  async calculateCurrentNetworth(): Promise<number> {
    try {
      const accounts = await this.getAllAccounts();
      return accounts.reduce((sum, account) => sum + account.balance, 0);
    } catch (error) {
      console.error("Error calculating networth:", error);
      return 0;
    }
  }

  async synchronizeNetworthHistory(): Promise<void> {
    try {
      if (!this.hasUserId()) {
        console.debug(
          "Skipping synchronizeNetworthHistory - no authenticated user",
        );
        return;
      }
      const currentNetworth = await this.calculateCurrentNetworth();
      await this.addNetworthSnapshot(currentNetworth);
    } catch (error) {
      console.error("Error in synchronizeNetworthHistory:", error);
    }
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
