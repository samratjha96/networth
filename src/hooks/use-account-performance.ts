import { useState, useEffect } from "react";
import { TimeRange } from "@/types/networth";
import { AccountWithValue } from "@/types/accounts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useDataSource } from "@/contexts/DataSourceContext";

// This interface would match what comes from Supabase's calculate_account_performance function
export interface AccountPerformance {
  accountId: string;
  accountName: string;
  accountType: string;
  isDebt: boolean;
  startValue: number;
  endValue: number;
  absoluteChange: number;
  percentChange: number;
}

// Simulate historical account data storage (only needed for localStorage implementation)
interface HistoricalAccountData {
  [accountId: string]: {
    [timeKey: string]: number;
  };
}

// Get a key for storing historical data based on time range
const getTimeKey = (timeRange: TimeRange) => {
  return `history_${timeRange}`;
};

export function useAccountPerformance(
  accounts: AccountWithValue[],
  timeRange: TimeRange,
) {
  const { dataSource, userId } = useDataSource();
  const [accountPerformances, setAccountPerformances] = useState<
    AccountPerformance[]
  >([]);
  const [bestPerformingAccount, setBestPerformingAccount] =
    useState<AccountPerformance | null>(null);

  // Local storage implementation
  const fetchLocalPerformanceData = () => {
    // Try to load historical data from localStorage
    const storedData = localStorage.getItem("account_historical_data");
    let accountHistory: HistoricalAccountData = storedData
      ? JSON.parse(storedData)
      : {};

    // Initialize any missing accounts with historical data
    let dataChanged = false;

    accounts.forEach((account) => {
      if (!accountHistory[account.id]) {
        accountHistory[account.id] = {};
        dataChanged = true;
      }

      // For each time range, initialize historical data if not present
      [1, 7, 30, 365, 0].forEach((period) => {
        const timeKey = getTimeKey(period as TimeRange);
        if (!accountHistory[account.id][timeKey]) {
          // Set initial historical value at 90-95% of current value
          const randomFactor = 0.9 + Math.random() * 0.05;
          accountHistory[account.id][timeKey] = account.balance * randomFactor;
          dataChanged = true;
        }
      });
    });

    // Save updated historical data
    if (dataChanged) {
      localStorage.setItem(
        "account_historical_data",
        JSON.stringify(accountHistory),
      );
    }

    // Calculate performance data for each account
    return accounts.map((account) => {
      const timeKey = getTimeKey(timeRange);

      // Get historical value for this account at this time range
      const startValue =
        accountHistory[account.id]?.[timeKey] || account.balance * 0.9;
      const endValue = account.balance;

      // Calculate actual change based on stored historical data
      const absoluteChange = endValue - startValue;
      const percentChange =
        startValue !== 0
          ? Math.round((absoluteChange / Math.abs(startValue)) * 1000) / 10
          : 0;

      return {
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        isDebt: account.isDebt || false,
        startValue,
        endValue,
        absoluteChange,
        percentChange,
      };
    });
  };

  // Supabase implementation
  const fetchSupabasePerformanceData = async () => {
    if (!userId || accounts.length === 0) {
      console.log("Skipping performance fetch - no userId or accounts:", {
        userId,
        accountCount: accounts.length,
      });
      return [];
    }

    try {
      // Calculate date range based on timeRange
      const endDate = new Date();
      const startDate = new Date();

      if (typeof timeRange === "number" && timeRange > 0) {
        startDate.setDate(startDate.getDate() - timeRange);
      } else {
        // For "all time", use a very old date
        startDate.setFullYear(startDate.getFullYear() - 10);
      }

      console.log("Fetching performance data with params:", {
        userId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const { data, error } = await supabase.rpc(
        "calculate_account_performance",
        {
          user_id_param: userId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
      );

      if (error) {
        console.error("Supabase RPC error:", error);
        throw error;
      }

      console.log("Successfully fetched performance data:", data);
      return data || [];
    } catch (error) {
      console.error("Error fetching account performance:", error);
      return [];
    }
  };

  // Using React Query for remote data
  const { data: remoteData, isLoading } = useQuery({
    queryKey: [
      "account-performance",
      userId,
      timeRange,
      accounts.map((a) => `${a.id}-${a.balance}`).join(","),
    ],
    queryFn: fetchSupabasePerformanceData,
    enabled: dataSource === "remote" && !!userId && accounts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    let performances: AccountPerformance[];

    if (dataSource === "remote" && remoteData) {
      performances = remoteData;
    } else {
      // Use local implementation for non-authenticated users or as fallback
      performances = fetchLocalPerformanceData();
    }

    setAccountPerformances(performances);

    // Find best performing account
    const best =
      performances.length > 0
        ? [...performances].sort((a, b) => b.percentChange - a.percentChange)[0]
        : null;
    setBestPerformingAccount(best);
  }, [dataSource, remoteData, accounts, timeRange]);

  return { accountPerformances, bestPerformingAccount };
}
