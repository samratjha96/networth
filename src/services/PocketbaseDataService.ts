import { AccountWithValue } from "@/types/accounts";
import { NetworthHistory, TimeRange } from "@/types/networth";
import { DataService } from "./DataService";
import { pocketbaseApi } from "@/api/pocketbase-api";
import { sanitizeAccountData } from "@/utils/api-helpers";

/**
 * PocketbaseDataService provides real API implementation using PocketBase
 * for authenticated users
 */
export class PocketbaseDataService implements DataService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getAccounts(): Promise<AccountWithValue[]> {
    return pocketbaseApi.accounts.getAccounts(this.userId);
  }

  async addAccount(
    accountData: Omit<AccountWithValue, "id">,
  ): Promise<AccountWithValue> {
    // Sanitize the account data
    const sanitizedData = sanitizeAccountData(accountData) as Omit<
      AccountWithValue,
      "id"
    >;

    // Create the account in PocketBase
    const newAccount = await pocketbaseApi.accounts.createAccount(
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

    // Update the account in PocketBase
    await pocketbaseApi.accounts.updateAccount(this.userId, sanitizedAccount);

    // Update net worth in history
    await this.updateNetworthHistory();
  }

  async deleteAccount(id: string): Promise<void> {
    // Delete the account in PocketBase
    await pocketbaseApi.accounts.deleteAccount(this.userId, id);

    // Update net worth in history
    await this.updateNetworthHistory();
  }

  async getNetWorthHistory(timeRange: TimeRange): Promise<NetworthHistory[]> {
    return pocketbaseApi.networth.getNetWorthHistory(this.userId, timeRange);
  }

  async getLatestNetWorth(timeRange: TimeRange): Promise<{
    currentValue: number;
    previousValue: number;
    change: number;
    percentageChange: number;
  } | null> {
    return pocketbaseApi.networth.getLatestNetWorth(this.userId, timeRange);
  }

  async getAccountPerformance(timeRange: TimeRange): Promise<
    {
      account_id: string;
      account_name: string;
      percent_change: number;
      amount_change: number;
    }[]
  > {
    // Get all account IDs
    const accounts = await this.getAccounts();
    const accountIds = accounts.map((account) => account.id);

    // Get performance data from PocketBase
    return pocketbaseApi.accounts.getAccountPerformance(
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

    // Update net worth history in PocketBase
    try {
      await pocketbaseApi.networth.updateNetWorthHistory(
        this.userId,
        totalNetWorth,
      );
    } catch (err) {
      console.error("Failed to update networth history:", err);
    }
  }
}
