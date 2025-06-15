import { useQuery } from "@tanstack/react-query";
import { useAppData } from "@/hooks/app-context";
import { TimeRange } from "@/types/networth";

/**
 * Hook for fetching performance metrics like net worth change
 * and best performing accounts
 */
export function useAppPerformance(timeRange: TimeRange) {
  const { dataService, mode } = useAppData();

  // Get net worth performance metrics
  const {
    data: netWorthData,
    isLoading: isLoadingNetWorth,
    error: netWorthError,
  } = useQuery({
    queryKey: ["networth-performance", mode, timeRange],
    queryFn: () => dataService.getLatestNetWorth(timeRange),
  });

  // Get account performance metrics
  const {
    data: accountPerformance,
    isLoading: isLoadingPerformance,
    error: performanceError,
  } = useQuery({
    queryKey: ["account-performance", mode, timeRange],
    queryFn: () => dataService.getAccountPerformance(timeRange),
  });

  // Find the best performing account
  const bestPerformingAccount =
    accountPerformance && accountPerformance.length > 0
      ? accountPerformance.reduce((best, current) =>
          current.percent_change > best.percent_change ? current : best,
        )
      : null;

  return {
    // Net worth metrics
    netWorthData: netWorthData || {
      currentValue: 0,
      previousValue: 0,
      change: 0,
      percentageChange: 0,
    },

    // Account performance metrics
    accountPerformance: accountPerformance || [],
    bestPerformingAccount,

    // Loading and error states
    isLoading: isLoadingNetWorth || isLoadingPerformance,
    error: netWorthError || performanceError,
  };
}
