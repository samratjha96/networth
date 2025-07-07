import { useQuery } from "@tanstack/react-query";
import { useAppData } from "@/hooks/app-context";
import { TimeRange } from "@/types/networth";
import { fillMissingDataPoints } from "@/utils/data-interpolation";
import { useMemo } from "react";

/**
 * Hook for fetching net worth chart data
 */
export function useAppNetWorthChart(timeRange: TimeRange) {
  const { dataService, mode } = useAppData();

  const {
    data: rawNetWorthHistory = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["networth-history", mode, timeRange],
    queryFn: () => dataService.getNetWorthHistory(timeRange),
  });

  // Process the raw data to fill gaps
  // This memoization is valuable as fillMissingDataPoints is computationally expensive
  // and depends only on rawNetWorthHistory and timeRange
  const networthHistory = useMemo(() => {
    // Only apply filling if we have at least one data point
    if (rawNetWorthHistory.length === 0) return [];

    // Apply our fill function to the raw data
    return fillMissingDataPoints(rawNetWorthHistory, timeRange);
  }, [rawNetWorthHistory, timeRange]);

  return {
    networthHistory,
    rawNetWorthHistory, // Also expose the raw data for debugging or comparison
    isLoading,
    error,

    // Convenience values
    currentNetWorth:
      networthHistory.length > 0
        ? networthHistory[networthHistory.length - 1].value
        : 0,

    isEmpty: networthHistory.length === 0,

    // Count of real vs. filled data points for informational purposes
    dataStats: {
      total: networthHistory.length,
      real: rawNetWorthHistory.length,
      filled: networthHistory.length - rawNetWorthHistory.length,
    },
  };
}
