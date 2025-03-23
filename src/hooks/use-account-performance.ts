import { useState, useEffect } from "react";
import { TimeRange } from "@/types/networth";
import { AccountWithValue } from "@/types/accounts";
import { useDataSource } from "@/contexts/DataSourceContext";
import { getStartDateForTimeRange } from "@/utils/time-range";
import { Database } from "@/types/supabase";
import { useAccountPerformance as useTanstackAccountPerformance } from "@/api/queries";

// Use the type from Supabase's auto-generated types
export type AccountPerformance =
  Database["public"]["Functions"]["calculate_account_performance"]["Returns"][0];

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
        account_id: account.id,
        account_name: account.name,
        account_type: account.type,
        is_debt: account.isDebt || false,
        start_value: startValue,
        end_value: endValue,
        absolute_change: absoluteChange,
        percent_change: percentChange,
      };
    });
  };

  // Using Tanstack Query for remote data
  const { data: remoteData, isLoading } = useTanstackAccountPerformance(
    dataSource === "remote" ? userId : null,
    timeRange,
    accounts,
  );

  useEffect(() => {
    const performances =
      dataSource === "remote" && remoteData
        ? remoteData
        : fetchLocalPerformanceData();

    setAccountPerformances(performances);

    // Find best performing account
    const best =
      performances.length > 0
        ? [...performances].sort(
            (a, b) => b.percent_change - a.percent_change,
          )[0]
        : null;
    setBestPerformingAccount(best);
  }, [dataSource, remoteData, accounts, timeRange]);

  return { accountPerformances, bestPerformingAccount, isLoading };
}
