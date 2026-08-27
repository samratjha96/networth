import { pb } from "@/lib/pocketbase";
import { AccountWithValue, AccountType } from "@/types/accounts";
import { CurrencyCode } from "@/types/currency";
import { TimeRange } from "@/types/networth";
import { AccountHistoryEntry } from "@/types/account-history";
import { getStartDateForTimeRange } from "@/utils/time-range";
import {
  calculatePercentageChange,
  calculateAccountTotals,
} from "@/utils/finance";
import {
  PocketBaseAccount,
  PocketBaseAccountValue,
  PocketBaseNetworthHistory,
} from "@/types/pocketbase";
/**
 * Helper functions for common operations
 */
type PocketBaseError = {
  message?: string;
  data?: unknown;
  status?: number;
};

const handleError = (error: PocketBaseError, context: string): never => {
  console.error(`PocketBase API Error in ${context}:`, error);
  throw new Error(`${context}: ${error.message || "Unknown error"}`);
};

const getHourStart = () => {
  const hourStart = new Date();
  hourStart.setMinutes(0, 0, 0);
  return hourStart;
};

// A single account's value as of a given date, derived from its hourly
// history rather than any separately-maintained snapshot. Falls back to the
// account's earliest known value when it has no history before asOfDate
// (e.g. the account was created after that date), so a young account
// contributes its starting balance instead of an artificial $0.
const getAccountValueAsOf = async (
  accountId: string,
  asOfDate: Date,
): Promise<number> => {
  try {
    const record = await pb
      .collection("argos_hourly_account_values")
      .getFirstListItem<PocketBaseAccountValue>(
        pb.filter("account_id = {:accountId} && hour_start <= {:asOfDate}", {
          accountId,
          asOfDate,
        }),
        { sort: "-hour_start" },
      );
    return record.value;
  } catch (error) {
    try {
      const record = await pb
        .collection("argos_hourly_account_values")
        .getFirstListItem<PocketBaseAccountValue>(
          pb.filter("account_id = {:accountId} && hour_start >= {:asOfDate}", {
            accountId,
            asOfDate,
          }),
          { sort: "hour_start" },
        );
      return record.value;
    } catch (error) {
      return 0;
    }
  }
};

/**
 * PocketBase API service
 * Abstracts all direct PocketBase calls into a clean API
 */
export const pocketbaseApi = {
  // Auth methods
  auth: {
    getSession: async () => {
      return pb.authStore.isValid ? pb.authStore.record : null;
    },

    getUser: async () => {
      return pb.authStore.record;
    },

    signInWithPassword: async (params: { email: string; password: string }) => {
      try {
        const authData = await pb
          .collection("users")
          .authWithPassword(params.email, params.password);

        if (pb.authStore.isValid && pb.authStore.record) {
          return { data: authData, error: null };
        } else {
          throw new Error("Authentication completed but authStore is invalid");
        }
      } catch (error) {
        pb.authStore.clear();
        return { data: null, error: error as PocketBaseError };
      }
    },

    signUp: async (params: {
      email: string;
      password: string;
      passwordConfirm?: string;
      name?: string;
    }) => {
      try {
        const data = await pb.collection("users").create({
          email: params.email,
          password: params.password,
          passwordConfirm: params.passwordConfirm || params.password,
          name: params.name || "",
        });
        return { data, error: null };
      } catch (error) {
        return { data: null, error: error as PocketBaseError };
      }
    },

    signOut: async () => {
      pb.authStore.clear();
      return { error: null };
    },

    signInWithOAuth: async (params: { provider: "google" }) => {
      try {
        // This method initializes a one-off realtime subscription and will
        // open a popup window with the OAuth2 vendor page to authenticate.
        // Once the external OAuth2 sign-in/sign-up flow is completed, the popup
        // window will be automatically closed and the OAuth2 data sent back
        // to the user through the previously established realtime connection.
        //
        // IMPORTANT: If the popup is being blocked on Safari, make sure that
        // your click handler is not using async/await.
        const authData = await pb.collection("users").authWithOAuth2({
          provider: params.provider,
        });

        if (pb.authStore.isValid && pb.authStore.record) {
          return { data: authData, error: null };
        } else {
          throw new Error("Authentication completed but authStore is invalid");
        }
      } catch (error) {
        pb.authStore.clear();
        return { data: null, error: error as PocketBaseError };
      }
    },
  },

  // Accounts methods
  accounts: {
    getAccounts: async (userId: string): Promise<AccountWithValue[]> => {
      try {
        const accounts = await pb
          .collection("argos_accounts")
          .getFullList<PocketBaseAccount>({
            filter: `user_id="${userId}"`,
          });

        if (!accounts?.length) {
          return [];
        }

        const accountIds = accounts.map((a) => a.id);

        // Fetch the most recent values for all accounts in one query.
        // Sorted newest-first; we pick the first entry per account_id in memory.
        const idFilter = accountIds
          .map((id) => `account_id="${id}"`)
          .join(" || ");
        const recentValues = await pb
          .collection("argos_hourly_account_values")
          .getList<PocketBaseAccountValue>(1, accountIds.length * 50, {
            filter: `user_id="${userId}" && (${idFilter})`,
            sort: "-hour_start",
          });

        const latestValues: Record<string, number> = {};
        for (const entry of recentValues.items) {
          if (!(entry.account_id in latestValues)) {
            latestValues[entry.account_id] = entry.value;
          }
        }

        return accounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type as AccountType,
          isDebt: account.is_debt || false,
          currency: account.currency as CurrencyCode,
          balance: latestValues[account.id] ?? 0,
        }));
      } catch (error) {
        console.error("❌ PocketBase: getAccounts error:", error);
        handleError(error as PocketBaseError, "getAccounts");
      }
    },

    createAccount: async (
      userId: string,
      accountData: Omit<AccountWithValue, "id">,
    ): Promise<AccountWithValue> => {
      try {
        // Create account in PocketBase
        const account = await pb
          .collection("argos_accounts")
          .create<PocketBaseAccount>({
            user_id: userId,
            name: accountData.name,
            type: accountData.type,
            currency: accountData.currency,
            is_debt: accountData.isDebt || false,
          });

        // Insert initial account value
        const hourStart = getHourStart();

        await pb.collection("argos_hourly_account_values").create({
          account_id: account.id,
          user_id: userId,
          hour_start: hourStart,
          value: accountData.balance,
        });

        // Return combined account data
        return {
          id: account.id,
          name: account.name,
          type: account.type as AccountType,
          balance: accountData.balance,
          isDebt: account.is_debt || false,
          currency: account.currency as CurrencyCode,
        };
      } catch (error) {
        handleError(error as PocketBaseError, "createAccount");
      }
    },

    updateAccount: async (
      userId: string,
      accountData: AccountWithValue,
    ): Promise<void> => {
      try {
        // Update account in PocketBase
        const updatedAccount = await pb
          .collection("argos_accounts")
          .update(accountData.id, {
            name: accountData.name,
            type: accountData.type,
            currency: accountData.currency,
            is_debt: accountData.isDebt || false,
          });

        // Update account value - use upsert pattern (try to update, if not found then create)
        const hourStart = getHourStart();
        // Try to find and update existing value for this hour
        try {
          const existingValue = await pb
            .collection("argos_hourly_account_values")
            .getFirstListItem<PocketBaseAccountValue>(
              pb.filter(
                "account_id = {:accountId} && hour_start = {:hourStart}",
                {
                  accountId: accountData.id,
                  hourStart: hourStart,
                },
              ),
            );

          // Update existing value
          await pb
            .collection("argos_hourly_account_values")
            .update(existingValue.id, {
              value: accountData.balance,
            });
        } catch (error) {
          // No existing value found, create new one
          await pb.collection("argos_hourly_account_values").create({
            account_id: accountData.id,
            user_id: userId,
            hour_start: hourStart,
            value: accountData.balance,
          });
        }
      } catch (error) {
        console.error("❌ PocketBase: updateAccount error:", error);
        handleError(error as PocketBaseError, "updateAccount");
      }
    },

    deleteAccount: async (
      _userId: string,
      accountId: string,
    ): Promise<void> => {
      try {
        // Delete account - this should cascade delete related records
        await pb.collection("argos_accounts").delete(accountId);
      } catch (error) {
        handleError(error as PocketBaseError, "deleteAccount");
      }
    },

    getAccountPerformance: async (
      userId: string,
      timeRange: TimeRange,
      accountIds: string[],
    ): Promise<
      Array<{
        account_id: string;
        account_name: string;
        percent_change: number;
        amount_change: number;
      }>
    > => {
      if (accountIds.length === 0) return [];

      try {
        // Calculate date range based on timeRange
        const endDate = new Date();
        const startDate = getStartDateForTimeRange(timeRange);

        // Get account data
        const accounts = await pb
          .collection("argos_accounts")
          .getFullList<PocketBaseAccount>({
            filter: `user_id="${userId}" && (${accountIds.map((id) => `id="${id}"`).join(" || ")})`,
          });

        // For each account, get the closest value to start_date and end_date
        const performance = await Promise.all(
          accounts.map(async (account) => {
            // Get start value (latest value before or at start_date)
            let startValue = 0;
            try {
              const startValueRecord = await pb
                .collection("argos_hourly_account_values")
                .getFirstListItem<PocketBaseAccountValue>(
                  pb.filter(
                    "account_id = {:accountId} && hour_start <= {:startDate}",
                    {
                      accountId: account.id,
                      startDate: startDate,
                    },
                  ),
                  {
                    sort: "-hour_start",
                  },
                );
              startValue = startValueRecord?.value ?? 0;
            } catch (error) {
              startValue = 0;
            }

            // Get end value (latest value before or at end_date)
            let endValue = 0;
            try {
              const endValueRecord = await pb
                .collection("argos_hourly_account_values")
                .getFirstListItem<PocketBaseAccountValue>(
                  pb.filter(
                    "account_id = {:accountId} && hour_start <= {:endDate}",
                    {
                      accountId: account.id,
                      endDate: endDate,
                    },
                  ),
                  {
                    sort: "-hour_start",
                  },
                );
              endValue = endValueRecord?.value ?? 0;
            } catch (error) {
              endValue = 0;
            }
            const amountChange = endValue - startValue;
            const percentChange = calculatePercentageChange(
              endValue,
              startValue,
            );

            return {
              account_id: account.id,
              account_name: account.name,
              percent_change: percentChange,
              amount_change: amountChange,
            };
          }),
        );

        return performance.sort((a, b) => b.amount_change - a.amount_change);
      } catch (error) {
        console.error("❌ PocketBase: getAccountPerformance error:", error);
        return [];
      }
    },

    getAccountHistory: async (
      userId: string,
      accountId: string,
      timeRange: TimeRange,
    ): Promise<AccountHistoryEntry[]> => {
      try {
        const startDate = getStartDateForTimeRange(timeRange);
        const endDate = new Date();

        // Get data within the time range
        const dataInRange = await pb
          .collection("argos_hourly_account_values")
          .getFullList<PocketBaseAccountValue>({
            filter: pb.filter(
              "user_id = {:userId} && account_id = {:accountId} && hour_start >= {:startDate} && hour_start <= {:endDate}",
              {
                userId: userId,
                accountId: accountId,
                startDate: startDate,
                endDate: endDate,
              },
            ),
            sort: "hour_start",
          });

        // Get the most recent data point BEFORE the time range for interpolation
        let dataBeforeRange: PocketBaseAccountValue[] = [];
        try {
          const beforeRangeRecord = await pb
            .collection("argos_hourly_account_values")
            .getFirstListItem<PocketBaseAccountValue>(
              pb.filter(
                "user_id = {:userId} && account_id = {:accountId} && hour_start < {:startDate}",
                {
                  userId: userId,
                  accountId: accountId,
                  startDate: startDate,
                },
              ),
              {
                sort: "-hour_start", // Most recent first
              },
            );
          dataBeforeRange = beforeRangeRecord ? [beforeRangeRecord] : [];
        } catch (error) {
          // No data before range, that's okay
        }

        // Combine the data: before range + in range
        const allData = [...dataBeforeRange, ...dataInRange];

        return allData.map((item, index) => ({
          date: item.hour_start,
          value: item.value,
          // Mark the first item as anchor if it's from before the range
          isAnchorPoint: index === 0 && dataBeforeRange.length > 0,
        }));
      } catch (error) {
        console.error("❌ PocketBase: getAccountHistory error:", error);
        handleError(error as PocketBaseError, "getAccountHistory");
      }
    },
  },

  // Networth methods
  networth: {
    getNetWorthHistory: async (userId: string, timeRange: TimeRange) => {
      try {
        const startDate = getStartDateForTimeRange(timeRange);
        const endDate = new Date();

        // Get data within the time range
        const dataInRange = await pb
          .collection("argos_networth_history")
          .getFullList<PocketBaseNetworthHistory>({
            filter: pb.filter(
              "user_id = {:userId} && date >= {:startDate} && date <= {:endDate}",
              {
                userId: userId,
                startDate: startDate,
                endDate: endDate,
              },
            ),
            sort: "date",
          });

        // Get the most recent data point BEFORE the time range for interpolation
        // We'll include this but mark it so the frontend can handle it appropriately
        let dataBeforeRange: PocketBaseNetworthHistory[] = [];
        try {
          const beforeRangeRecord = await pb
            .collection("argos_networth_history")
            .getFirstListItem<PocketBaseNetworthHistory>(
              pb.filter("user_id = {:userId} && date < {:startDate}", {
                userId: userId,
                startDate: startDate,
              }),
              {
                sort: "-date", // Most recent first
              },
            );
          dataBeforeRange = beforeRangeRecord ? [beforeRangeRecord] : [];
        } catch (error) {
          // No data before range, that's okay
        }

        // Combine the data: before range + in range
        const allData = [...dataBeforeRange, ...dataInRange];

        return allData.map((item, index) => ({
          date: item.date,
          value: item.value,
          // Mark the first item as anchor if it's from before the range
          isAnchorPoint: index === 0 && dataBeforeRange.length > 0,
        }));
      } catch (error) {
        handleError(error as PocketBaseError, "getNetWorthHistory");
      }
    },

    getLatestNetWorth: async (userId: string, timeRange: TimeRange) => {
      try {
        // Derive current net worth live from account balances rather than
        // trusting the argos_networth_history snapshot, whose write path can
        // silently fail and drift out of sync with actual account state.
        const accounts = await pocketbaseApi.accounts.getAccounts(userId);
        if (!accounts.length) return null;

        const currentValue = calculateAccountTotals(accounts).netWorth;

        // Previous value: each account's value as of the start of the
        // range, summed — i.e. the portfolio projected forward from the
        // last known value per account.
        const startDate = getStartDateForTimeRange(timeRange);
        const previousValues = await Promise.all(
          accounts.map((account) => getAccountValueAsOf(account.id, startDate)),
        );
        const previousValue = previousValues.reduce(
          (sum, value) => sum + value,
          0,
        );

        const change = currentValue - previousValue;
        const percentageChange = calculatePercentageChange(
          currentValue,
          previousValue,
        );

        return {
          currentValue,
          previousValue,
          change,
          percentageChange,
        };
      } catch (error) {
        handleError(error as PocketBaseError, "getLatestNetWorth");
      }
    },

    updateNetWorthHistory: async (
      userId: string,
      currentNetWorth: number,
    ): Promise<void> => {
      try {
        const now = new Date();
        const hourStart = getHourStart();

        // Check if an entry for this hour already exists
        const existingEntries = await pb
          .collection("argos_networth_history")
          .getFullList<PocketBaseNetworthHistory>({
            filter: pb.filter(
              "user_id = {:userId} && date >= {:hourStart} && date < {:hourEnd}",
              {
                userId: userId,
                hourStart: hourStart,
                hourEnd: new Date(hourStart.getTime() + 3600000),
              },
            ),
            sort: "-date",
          });

        if (existingEntries && existingEntries.length > 0) {
          // Update the existing entry for this hour
          const latestEntry = existingEntries[0];

          await pb.collection("argos_networth_history").update(latestEntry.id, {
            value: currentNetWorth,
          });
        } else {
          // Create a new entry for this hour
          await pb.collection("argos_networth_history").create({
            user_id: userId,
            value: currentNetWorth,
            date: now, // Use the exact current time
          });
        }
      } catch (error) {
        handleError(error as PocketBaseError, "updateNetWorthHistory");
      }
    },
  },
};
