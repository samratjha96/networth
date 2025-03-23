import { TimeRange } from "@/types/networth";
import { useDataSource } from "@/contexts/DataSourceContext";
import { getStartDateForTimeRange } from "@/utils/time-range";
import {
  useNetWorthHistory as useTanstackNetWorthHistory,
  useUpdateNetWorth,
} from "@/api/queries";
import { supabaseApi } from "@/api/supabase-api";

// Interface for net worth data returned by the hook
export interface NetWorthData {
  currentValue: number;
  previousValue: number;
  change: number;
  percentageChange: number;
}

// Function to update networth history - now delegates to the API layer
export async function updateNetworthHistory(
  userId: string,
  currentNetWorth: number,
) {
  if (!userId) {
    console.log("[DEBUG] Skipping networth history update - no userId");
    return;
  }

  try {
    await supabaseApi.networth.updateNetWorthHistory(userId, currentNetWorth);
    console.log("[DEBUG] Networth history updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating networth history:", error);
    return false;
  }
}

export function useNetWorthHistory(
  currentNetWorth: number,
  timeRange: TimeRange,
) {
  const { dataSource, userId } = useDataSource();

  // Default data state (for loading or error)
  const defaultData: NetWorthData = {
    currentValue: currentNetWorth,
    previousValue: currentNetWorth * 0.95,
    change: currentNetWorth * 0.05,
    percentageChange: 5,
  };

  // Local storage implementation
  const fetchLocalNetWorthHistory = () => {
    const startDate = getStartDateForTimeRange(timeRange);
    const key = `networth_${startDate.toISOString()}`;

    // Try to load historical data from localStorage
    const storedValue = localStorage.getItem(key);
    const previousValue = storedValue
      ? parseFloat(storedValue)
      : currentNetWorth * 0.95;

    // Calculate change and percentage
    const change = currentNetWorth - previousValue;
    const percentageChange =
      previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : 0;

    // Store current value for future reference
    localStorage.setItem(
      `networth_${new Date().toISOString()}`,
      currentNetWorth.toString(),
    );

    return {
      currentValue: currentNetWorth,
      previousValue,
      change,
      percentageChange,
    };
  };

  // Using Tanstack Query for remote data
  const {
    data: remoteData,
    isLoading,
    error,
  } = useTanstackNetWorthHistory(
    dataSource === "remote" ? userId : null,
    timeRange,
  );

  // Return data based on the current data source
  if (dataSource === "local") {
    return fetchLocalNetWorthHistory();
  }

  if (isLoading || error) {
    return defaultData;
  }

  return remoteData || defaultData;
}
