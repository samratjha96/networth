import { useQuery } from "@tanstack/react-query";
import { useAppData } from "@/hooks/app-context";
import { TimeRange } from "@/types/networth";

/**
 * Hook for fetching net worth chart data
 */
export function useAppNetWorthChart(timeRange: TimeRange) {
  const { dataService, mode } = useAppData();

  const {
    data: networthHistory = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["networth-history", mode, timeRange],
    queryFn: () => dataService.getNetWorthHistory(timeRange),
  });

  return {
    networthHistory,
    isLoading,
    error,

    // Convenience values
    currentNetWorth:
      networthHistory.length > 0
        ? networthHistory[networthHistory.length - 1].value
        : 0,

    isEmpty: networthHistory.length === 0,
  };
}
