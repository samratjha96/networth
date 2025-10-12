// ABOUTME: Standardized net worth hooks using TanStack Query best practices
// ABOUTME: Demonstrates proper query organization and data processing

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { DataService } from "@/services/DataService";
import { TimeRange } from "@/types/networth";
import { queryKeys } from "@/lib/query-keys";
import { createQueryOptions, createEnabledOption } from "@/lib/query-options";
import { fillMissingDataPoints } from "@/utils/data-interpolation";

interface UseNetworthStandardOptions {
  userId: string | null;
  dataService: DataService;
}

/**
 * Hook for net worth chart data with standardized patterns
 */
export function useNetworthChart({
  userId,
  dataService,
  timeRange,
}: UseNetworthStandardOptions & { timeRange: TimeRange }) {
  // Standardized query options for chart data
  const chartQueryOptions = createQueryOptions(
    {
      queryKey: queryKeys.networthChart(userId, timeRange),
      queryFn: () => dataService.getNetWorthHistory(timeRange),
      ...createEnabledOption(userId),
    },
    "background", // Background data for charts
  );

  const {
    data: rawNetWorthHistory = [],
    isLoading,
    error,
    refetch,
  } = useQuery(chartQueryOptions);

  // Processed data with gap filling (memoized for performance)
  const processedData = useMemo(() => {
    if (rawNetWorthHistory.length === 0) {
      return {
        networthHistory: [],
        currentNetWorth: 0,
        isEmpty: true,
        dataStats: { total: 0, real: 0, filled: 0 },
      };
    }

    const networthHistory = fillMissingDataPoints(
      rawNetWorthHistory,
      timeRange,
    );
    const currentNetWorth =
      networthHistory.length > 0
        ? networthHistory[networthHistory.length - 1].value
        : 0;

    return {
      networthHistory,
      currentNetWorth,
      isEmpty: networthHistory.length === 0,
      dataStats: {
        total: networthHistory.length,
        real: rawNetWorthHistory.length,
        filled: networthHistory.length - rawNetWorthHistory.length,
      },
    };
  }, [rawNetWorthHistory, timeRange]);

  return {
    // Processed data
    ...processedData,

    // Raw data for debugging/comparison
    rawNetWorthHistory,

    // States
    isLoading,
    error,

    // Actions
    refetch,

    // Query meta
    queryKey: chartQueryOptions.queryKey,
    timeRange,
  };
}

/**
 * Hook for net worth performance metrics
 */
export function useNetworthPerformance({
  userId,
  dataService,
  timeRange,
}: UseNetworthStandardOptions & { timeRange: TimeRange }) {
  // Standardized query options for performance data
  const performanceQueryOptions = createQueryOptions(
    {
      queryKey: queryKeys.networthPerformance(userId, timeRange),
      queryFn: () => dataService.getLatestNetWorth(timeRange),
      ...createEnabledOption(userId),
    },
    "realtime", // Real-time performance data
  );

  const {
    data: performanceData,
    isLoading,
    error,
    refetch,
  } = useQuery(performanceQueryOptions);

  // Provide defaults and calculate additional metrics
  const processedMetrics = useMemo(() => {
    const defaultData = {
      currentValue: 0,
      previousValue: 0,
      change: 0,
      percentageChange: 0,
    };

    if (!performanceData) return defaultData;

    return {
      ...defaultData,
      ...performanceData,
      // Additional calculated fields
      isPositive: performanceData.change >= 0,
      isSignificantChange: Math.abs(performanceData.percentageChange) >= 1, // 1% threshold
      formattedChange:
        performanceData.change >= 0
          ? `+${performanceData.change.toFixed(2)}`
          : performanceData.change.toFixed(2),
      formattedPercentage:
        performanceData.percentageChange >= 0
          ? `+${performanceData.percentageChange.toFixed(2)}%`
          : `${performanceData.percentageChange.toFixed(2)}%`,
    };
  }, [performanceData]);

  return {
    // Performance metrics
    ...processedMetrics,

    // States
    isLoading,
    error,

    // Actions
    refetch,

    // Query meta
    queryKey: performanceQueryOptions.queryKey,
    timeRange,
  };
}

/**
 * Hook for account performance metrics
 */
export function useAccountPerformance({
  userId,
  dataService,
  timeRange,
}: UseNetworthStandardOptions & { timeRange: TimeRange }) {
  // Standardized query options for account performance
  const accountPerformanceQueryOptions = createQueryOptions(
    {
      queryKey: queryKeys.accountPerformance(userId, timeRange),
      queryFn: () => dataService.getAccountPerformance(timeRange),
      ...createEnabledOption(userId),
    },
    "background", // Background analytical data
  );

  const {
    data: accountPerformance = [],
    isLoading,
    error,
    refetch,
  } = useQuery(accountPerformanceQueryOptions);

  // Process account performance data
  const processedPerformance = useMemo(() => {
    if (accountPerformance.length === 0) {
      return {
        accounts: [],
        bestPerforming: null,
        worstPerforming: null,
        totalAccounts: 0,
        positiveAccounts: 0,
        negativeAccounts: 0,
      };
    }

    const sortedAccounts = [...accountPerformance].sort(
      (a, b) => b.percent_change - a.percent_change,
    );

    const positiveAccounts = accountPerformance.filter(
      (acc) => acc.percent_change > 0,
    ).length;
    const negativeAccounts = accountPerformance.filter(
      (acc) => acc.percent_change < 0,
    ).length;

    return {
      accounts: sortedAccounts,
      bestPerforming: sortedAccounts[0] || null,
      worstPerforming: sortedAccounts[sortedAccounts.length - 1] || null,
      totalAccounts: accountPerformance.length,
      positiveAccounts,
      negativeAccounts,
    };
  }, [accountPerformance]);

  return {
    // Processed performance data
    ...processedPerformance,

    // Raw data
    rawAccountPerformance: accountPerformance,

    // States
    isLoading,
    error,

    // Actions
    refetch,

    // Query meta
    queryKey: accountPerformanceQueryOptions.queryKey,
    timeRange,
  };
}

/**
 * Combined hook for all net worth related data
 */
export function useNetworthData({
  userId,
  dataService,
  timeRange,
}: UseNetworthStandardOptions & { timeRange: TimeRange }) {
  const chartData = useNetworthChart({ userId, dataService, timeRange });
  const performanceData = useNetworthPerformance({
    userId,
    dataService,
    timeRange,
  });
  const accountPerformanceData = useAccountPerformance({
    userId,
    dataService,
    timeRange,
  });

  return {
    chart: chartData,
    performance: performanceData,
    accountPerformance: accountPerformanceData,

    // Combined loading state
    isLoading:
      chartData.isLoading ||
      performanceData.isLoading ||
      accountPerformanceData.isLoading,

    // Combined error state
    error:
      chartData.error || performanceData.error || accountPerformanceData.error,

    // Combined refetch
    refetchAll: () => {
      chartData.refetch();
      performanceData.refetch();
      accountPerformanceData.refetch();
    },
  };
}

/**
 * Types for all hook return values
 */
export type UseNetworthChartReturn = ReturnType<typeof useNetworthChart>;
export type UseNetworthPerformanceReturn = ReturnType<
  typeof useNetworthPerformance
>;
export type UseAccountPerformanceReturn = ReturnType<
  typeof useAccountPerformance
>;
export type UseNetworthDataReturn = ReturnType<typeof useNetworthData>;
