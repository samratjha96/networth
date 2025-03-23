import { supabase } from "@/lib/supabase";
import { AccountWithValue, AccountType } from "@/types/accounts";
import { CurrencyCode } from "@/types/currency";
import { TimeRange } from "@/types/networth";
import { getStartDateForTimeRange } from "@/utils/time-range";
import { User } from "@supabase/supabase-js";

/**
 * Helper functions for common operations
 */
const handleError = (error: any): never => {
  throw error;
};

// Generic function to handle Supabase queries
const executeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
) => {
  const { data, error } = await queryFn();
  if (error) handleError(error);
  return data;
};

const getHourStart = () => {
  const hourStart = new Date();
  hourStart.setMinutes(0, 0, 0);
  return hourStart;
};

/**
 * Supabase API service
 * Abstracts all direct Supabase calls into a clean API
 */
export const supabaseApi = {
  // Auth methods
  auth: {
    getSession: async () => {
      return supabase.auth.getSession();
    },

    getUser: async () => {
      return supabase.auth.getUser();
    },

    signInWithPassword: async (email: string, password: string) => {
      return supabase.auth.signInWithPassword({ email, password });
    },

    signInWithOAuth: async (provider: "google") => {
      return supabase.auth.signInWithOAuth({ provider });
    },

    signUp: async (
      email: string,
      password: string,
      options?: { data?: { full_name: string } },
    ) => {
      return supabase.auth.signUp({ email, password, options });
    },

    signOut: async () => {
      return supabase.auth.signOut();
    },
  },

  // Accounts methods
  accounts: {
    getAccounts: async (userId: string) => {
      // Get accounts
      const accountsData = await executeQuery<any[]>(async () => {
        return await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", userId);
      });

      if (!accountsData?.length) return [];

      // Get latest values for each account
      const accountIds = accountsData.map((account) => account.id);

      // This query gets the latest hourly value for each account
      const valuesData = await executeQuery<any[]>(async () => {
        return await supabase
          .from("hourly_account_values")
          .select("account_id, value, hour_start")
          .in("account_id", accountIds)
          .order("hour_start", { ascending: false });
      });

      // Create a map of latest values
      const latestValues: Record<string, number> = {};

      // Only take the first (latest) value for each account
      if (valuesData) {
        valuesData.forEach((value) => {
          if (!latestValues[value.account_id]) {
            latestValues[value.account_id] = value.value;
          }
        });
      }

      // Map accounts with values
      const accountsWithValues: AccountWithValue[] = accountsData.map(
        (account) => ({
          id: account.id,
          name: account.name,
          type: account.type as AccountType,
          isDebt: account.is_debt || false,
          currency: account.currency as CurrencyCode,
          balance: latestValues[account.id] || 0,
        }),
      );

      return accountsWithValues;
    },

    createAccount: async (
      userId: string,
      accountData: Omit<AccountWithValue, "id">,
    ) => {
      // Create account in Supabase
      const data = await executeQuery<any>(async () => {
        return await supabase
          .from("accounts")
          .insert({
            user_id: userId,
            name: accountData.name,
            type: accountData.type,
            currency: accountData.currency,
            is_debt: accountData.isDebt || false,
          })
          .select()
          .single();
      });

      if (!data) throw new Error("No data returned from account creation");

      // Insert initial account value
      const hourStart = getHourStart();

      await executeQuery(async () => {
        return await supabase.from("hourly_account_values").insert({
          account_id: data.id,
          user_id: userId,
          hour_start: hourStart.toISOString(),
          value: accountData.balance,
        });
      });

      // Return combined account data
      return {
        id: data.id,
        name: data.name,
        type: data.type as AccountType,
        balance: accountData.balance,
        isDebt: data.is_debt || false,
        currency: data.currency as CurrencyCode,
      };
    },

    updateAccount: async (userId: string, accountData: AccountWithValue) => {
      // Update account in Supabase
      await executeQuery(async () => {
        return await supabase
          .from("accounts")
          .update({
            name: accountData.name,
            type: accountData.type,
            currency: accountData.currency,
            is_debt: accountData.isDebt || false,
          })
          .eq("id", accountData.id)
          .eq("user_id", userId);
      });

      // Update account value
      const hourStart = getHourStart();

      // Check if we already have a value for this hour
      const existingValues = await executeQuery<any[]>(async () => {
        return await supabase
          .from("hourly_account_values")
          .select("*")
          .eq("account_id", accountData.id)
          .gte("hour_start", hourStart.toISOString())
          .lt(
            "hour_start",
            new Date(hourStart.getTime() + 3600000).toISOString(),
          );
      });

      if (existingValues && existingValues.length > 0) {
        // Update existing value
        await executeQuery(async () => {
          return await supabase
            .from("hourly_account_values")
            .update({
              value: accountData.balance,
            })
            .eq("account_id", existingValues[0].account_id)
            .eq("hour_start", existingValues[0].hour_start);
        });
      } else {
        // Insert new value
        await executeQuery(async () => {
          return await supabase.from("hourly_account_values").insert({
            account_id: accountData.id,
            user_id: userId,
            hour_start: hourStart.toISOString(),
            value: accountData.balance,
          });
        });
      }
    },

    deleteAccount: async (userId: string, accountId: string) => {
      // Delete account - cascade should handle related records
      await executeQuery(async () => {
        return await supabase
          .from("accounts")
          .delete()
          .eq("id", accountId)
          .eq("user_id", userId);
      });
    },

    getAccountPerformance: async (
      userId: string,
      timeRange: TimeRange,
      accountIds: string[],
    ) => {
      if (accountIds.length === 0) return [];

      // Calculate date range based on timeRange
      const endDate = new Date();
      const startDate = getStartDateForTimeRange(timeRange);

      const data = await executeQuery(async () => {
        return await supabase.rpc("calculate_account_performance", {
          user_id_param: userId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        });
      });

      return data || [];
    },
  },

  // Networth methods
  networth: {
    getNetWorthHistory: async (userId: string, timeRange: TimeRange) => {
      const startDate = getStartDateForTimeRange(timeRange);
      const endDate = new Date();

      const data = await executeQuery(async () => {
        return await supabase
          .from("networth_history")
          .select("date, value")
          .eq("user_id", userId)
          .gte("date", startDate.toISOString())
          .lte("date", endDate.toISOString())
          .order("date", { ascending: true });
      });

      return data || [];
    },

    getLatestNetWorth: async (userId: string, timeRange: TimeRange) => {
      const startDate = getStartDateForTimeRange(timeRange);

      // Get latest net worth value
      const latestData = await executeQuery<any[]>(async () => {
        return await supabase
          .from("networth_history")
          .select("value, date")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(1);
      });

      // Get previous net worth value based on time range
      const previousData = await executeQuery<any[]>(async () => {
        return await supabase
          .from("networth_history")
          .select("value, date")
          .eq("user_id", userId)
          .gte("date", startDate.toISOString())
          .order("date", { ascending: true })
          .limit(1);
      });

      if (!latestData?.length) return null;

      const currentValue = latestData[0].value;
      const previousValue = previousData?.[0]?.value ?? currentValue * 0.95;
      const change = currentValue - previousValue;
      const percentageChange =
        previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : 0;

      return {
        currentValue,
        previousValue,
        change,
        percentageChange,
      };
    },

    updateNetWorthHistory: async (userId: string, currentNetWorth: number) => {
      const now = new Date();
      const hourStart = getHourStart();

      // Check if an entry for this hour already exists
      const existingEntries = await executeQuery<any[]>(async () => {
        return await supabase
          .from("networth_history")
          .select("id, value, date")
          .eq("user_id", userId)
          .gte("date", hourStart.toISOString())
          .lt("date", new Date(hourStart.getTime() + 3600000).toISOString()) // Add 1 hour
          .order("date", { ascending: false });
      });

      if (existingEntries && existingEntries.length > 0) {
        // Update the existing entry for this hour
        const latestEntry = existingEntries[0];

        await executeQuery(async () => {
          return await supabase
            .from("networth_history")
            .update({ value: currentNetWorth })
            .eq("id", latestEntry.id);
        });
      } else {
        // Create a new entry for this hour
        await executeQuery(async () => {
          return await supabase.from("networth_history").insert({
            user_id: userId,
            value: currentNetWorth,
            date: now.toISOString(), // Use the exact current time
          });
        });
      }
    },
  },
};
