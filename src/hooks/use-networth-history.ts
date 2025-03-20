import { useState, useEffect } from "react";
import { TimeRange } from "@/types/networth";

// Interface for net worth data returned by the hook
export interface NetWorthData {
  currentValue: number;
  previousValue: number;
  change: number;
  percentageChange: number;
}

// Simulate historical net worth data storage (only needed for localStorage implementation)
interface NetWorthHistoryData {
  [timeKey: string]: number;
}

// Get a key for storing historical data based on time range
const getTimeKey = (timeRange: TimeRange) => {
  return `history_${timeRange}`;
};

export function useNetWorthHistory(
  currentNetWorth: number,
  timeRange: TimeRange,
) {
  const [netWorthData, setNetWorthData] = useState<NetWorthData>({
    currentValue: currentNetWorth,
    previousValue: currentNetWorth * 0.95, // Default 5% lower
    change: currentNetWorth * 0.05,
    percentageChange: 5,
  });

  useEffect(() => {
    // This would be replaced with a Supabase call in production
    // For now, we use localStorage to simulate historical data

    // === START: Replace this block with Supabase call in production ===
    const fetchNetWorthHistory = () => {
      // Try to load historical data from localStorage
      const storedData = localStorage.getItem("networth_historical_data");
      let netWorthHistory: NetWorthHistoryData = storedData
        ? JSON.parse(storedData)
        : {};

      // Initialize any missing time ranges with historical data
      let dataChanged = false;

      // For each time range, initialize historical data if not present
      [1, 7, 30, 365, 0].forEach((period) => {
        const timeKey = getTimeKey(period as TimeRange);
        if (!netWorthHistory[timeKey]) {
          // Set initial historical value at 92-97% of current value
          // This creates a reasonable range of growth
          const randomFactor = 0.92 + Math.random() * 0.05;
          netWorthHistory[timeKey] = currentNetWorth * randomFactor;
          dataChanged = true;
        }
      });

      // Save updated historical data
      if (dataChanged) {
        localStorage.setItem(
          "networth_historical_data",
          JSON.stringify(netWorthHistory),
        );
      }

      // Get the historical value for this time range
      const timeKey = getTimeKey(timeRange);
      const previousValue = netWorthHistory[timeKey] || currentNetWorth * 0.95;

      // Calculate change and percentage
      const change = currentNetWorth - previousValue;
      const percentageChange =
        previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : 0;

      return {
        currentValue: currentNetWorth,
        previousValue,
        change,
        percentageChange,
      };
    };

    // Calculate and update the net worth data
    const data = fetchNetWorthHistory();
    setNetWorthData(data);
    // === END: Replace this block with Supabase call in production ===

    /* 
    // SUPABASE IMPLEMENTATION WOULD LOOK LIKE THIS:
    
    const fetchNetWorthHistory = async () => {
      // This would be an actual async call to Supabase
      const { data, error } = await supabase
        .rpc('calculate_networth_change', { 
          user_id: currentUser.id, 
          time_range_days: timeRange 
        });
        
      if (error) {
        console.error('Error fetching net worth history:', error);
        return {
          currentValue: currentNetWorth,
          previousValue: currentNetWorth * 0.95,
          change: currentNetWorth * 0.05,
          percentageChange: 5,
        };
      }
      
      return data;
    };
    
    // Fetch data and update state
    fetchNetWorthHistory().then(data => {
      setNetWorthData(data);
    });
    */
  }, [currentNetWorth, timeRange]);

  return netWorthData;
}
