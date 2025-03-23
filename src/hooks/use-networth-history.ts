import { TimeRange } from "@/types/networth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useDataSource } from "@/contexts/DataSourceContext";
import { getStartDateForTimeRange } from "@/utils/time-range";

// Interface for net worth data returned by the hook
export interface NetWorthData {
  currentValue: number;
  previousValue: number;
  change: number;
  percentageChange: number;
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

  // Supabase implementation
  const fetchSupabaseNetWorthHistory = async () => {
    if (!userId) return defaultData;

    try {
      const startDate = getStartDateForTimeRange(timeRange);

      // Get latest net worth value
      const { data: latestData, error: latestError } = await supabase
        .from("networth_history")
        .select("value, date")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(1);

      if (latestError) throw latestError;

      // Get previous net worth value based on time range
      const { data: previousData, error: previousError } = await supabase
        .from("networth_history")
        .select("value, date")
        .eq("user_id", userId)
        .gte("date", startDate.toISOString())
        .order("date", { ascending: true })
        .limit(1);

      if (previousError) throw previousError;

      if (!latestData?.length) return defaultData;

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
    } catch (error) {
      console.error("Error fetching net worth history:", error);
      return defaultData;
    }
  };

  // Using React Query for remote data
  const {
    data: remoteData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["networth-history", userId, timeRange, currentNetWorth],
    queryFn: fetchSupabaseNetWorthHistory,
    enabled: dataSource === "remote" && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Return data based on the current data source
  if (dataSource === "local") {
    return fetchLocalNetWorthHistory();
  }

  if (isLoading || error) {
    return defaultData;
  }

  return remoteData || defaultData;
}
