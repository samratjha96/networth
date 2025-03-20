import { useState, useEffect } from "react";
import { TimeRange } from "@/types/networth";
import { AccountWithValue } from "@/types/accounts";

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
  const [accountPerformances, setAccountPerformances] = useState<
    AccountPerformance[]
  >([]);
  const [bestPerformingAccount, setBestPerformingAccount] =
    useState<AccountPerformance | null>(null);

  useEffect(() => {
    // This would be replaced with a Supabase call in production
    // For now, we use localStorage to simulate historical data

    // === START: Replace this block with Supabase call in production ===
    const fetchPerformanceData = () => {
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
            accountHistory[account.id][timeKey] =
              account.balance * randomFactor;
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
      const performances = accounts.map((account) => {
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

      return performances;
    };

    // Simulate an async API call
    const performances = fetchPerformanceData();
    setAccountPerformances(performances);

    // Find best performing account
    const best =
      performances.length > 0
        ? [...performances].sort((a, b) => b.percentChange - a.percentChange)[0]
        : null;
    setBestPerformingAccount(best);
    // === END: Replace this block with Supabase call in production ===

    /* 
    // SUPABASE IMPLEMENTATION WOULD LOOK LIKE THIS:
    
    const fetchPerformanceData = async () => {
      // This would be an actual async call to Supabase
      const { data, error } = await supabase
        .rpc('calculate_account_performance', { 
          user_id: currentUser.id, 
          time_range_days: timeRange 
        });
        
      if (error) {
        console.error('Error fetching account performance:', error);
        return [];
      }
      
      return data;
    };
    
    // Fetch data and update state
    fetchPerformanceData().then(performances => {
      setAccountPerformances(performances);
      
      // Find best performing account
      const best = performances.length > 0
        ? performances[0] // Already sorted by the DB function
        : null;
      setBestPerformingAccount(best);
    });
    */
  }, [accounts, timeRange]);

  return { accountPerformances, bestPerformingAccount };
}
