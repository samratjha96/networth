import { AccountWithValue } from "@/types/accounts";
import { NetworthHistory, TimeRange } from "@/types/networth";
import { DataService } from "./DataService";
import { supabaseApi } from "@/api/supabase-api";
import { sanitizeAccountData } from "@/utils/api-helpers";

/**
 * SupabaseDataService provides real API implementation using Supabase
 * for authenticated users
 */
export class SupabaseDataService implements DataService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getAccounts(): Promise<AccountWithValue[]> {
    return supabaseApi.accounts.getAccounts(this.userId);
  }

  async addAccount(
    accountData: Omit<AccountWithValue, "id">,
  ): Promise<AccountWithValue> {
    // Sanitize the account data
    const sanitizedData = sanitizeAccountData(accountData) as Omit<
      AccountWithValue,
      "id"
    >;

    // Create the account in Supabase
    const newAccount = await supabaseApi.accounts.createAccount(
      this.userId,
      sanitizedData,
    );

    // Update net worth in history
    await this.updateNetworthHistory();

    return newAccount;
  }

  async updateAccount(account: AccountWithValue): Promise<void> {
    // Sanitize the account data
    const sanitizedAccount = sanitizeAccountData(account) as AccountWithValue;

    // Update the account in Supabase
    await supabaseApi.accounts.updateAccount(this.userId, sanitizedAccount);

    // Update net worth in history
    await this.updateNetworthHistory();
  }

  async deleteAccount(id: string): Promise<void> {
    // Delete the account in Supabase
    await supabaseApi.accounts.deleteAccount(this.userId, id);

    // Update net worth in history
    await this.updateNetworthHistory();
  }

  async getNetWorthHistory(timeRange: TimeRange): Promise<NetworthHistory[]> {
    return supabaseApi.networth.getNetWorthHistory(this.userId, timeRange);
  }

  async getLatestNetWorth(timeRange: TimeRange): Promise<{
    currentValue: number;
    previousValue: number;
    change: number;
    percentageChange: number;
  } | null> {
    return supabaseApi.networth.getLatestNetWorth(this.userId, timeRange);
  }

  async getAccountPerformance(timeRange: TimeRange): Promise<
    | {
        account_id: string;
        account_name: string;
        percent_change: number;
        amount_change: number;
      }[]
    | null
  > {
    // Get all account IDs
    const accounts = await this.getAccounts();
    const accountIds = accounts.map((account) => account.id);

    // Get performance data from Supabase
    return supabaseApi.accounts.getAccountPerformance(
      this.userId,
      timeRange,
      accountIds,
    );
  }

  // Helper method to update net worth in history
  private async updateNetworthHistory(): Promise<void> {
    // Get all accounts
    const accounts = await this.getAccounts();

    // Calculate current net worth
    const totalNetWorth = accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );

    // Update net worth history in Supabase
    try {
      await supabaseApi.networth.updateNetWorthHistory(
        this.userId,
        totalNetWorth,
      );
    } catch (err) {
      console.error("Failed to update networth history:", err);
    }
  }
}
