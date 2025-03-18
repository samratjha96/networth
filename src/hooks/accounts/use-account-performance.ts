import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/components/DatabaseProvider";
import { AccountWithValue } from "@/types/accounts";
import { PerformanceData } from "@/types/performance";
import { calculateAccountPerformance } from "./use-performance-calculator";
import { TimeRange } from "@/types/networth";

/**
 * Hook for calculating account performance metrics
 */
export function useAccountPerformance(
  accounts: AccountWithValue[],
  period: TimeRange = "month",
): PerformanceData {
  const { db } = useDb();

  const query = useQuery({
    queryKey: [
      "accountPerformance",
      { accountIds: accounts.map((a) => a.id), period },
    ],
    queryFn: async () => {
      if (!accounts || accounts.length === 0) {
        return {
          bestPerformer: null,
          worstPerformer: null,
        };
      }

      // Determine days based on period
      const days =
        typeof period === "number"
          ? period === 0
            ? 365 * 10
            : period // if 0 (ALL), use 10 years as default
          : period === "day"
            ? 1
            : period === "week"
              ? 7
              : period === "year"
                ? 365
                : period === "all"
                  ? 365 * 10
                  : 30; // default to month (30 days)

      // Get performance data for each account
      const accountPerformance = await calculateAccountPerformance(
        accounts,
        days,
        db,
      );

      console.log(
        "Account performance:",
        JSON.stringify(accountPerformance, null, 2),
      );

      // Filter by asset and liability
      const assetPerformance = accountPerformance.filter((a) => !a.isDebt);
      const liabilityPerformance = accountPerformance.filter((a) => a.isDebt);

      let bestPerformer = null;
      let worstPerformer = null;

      if (assetPerformance.length > 0) {
        // For assets, higher percentage is better
        bestPerformer = assetPerformance.reduce((best, current) =>
          current.changePercentage > best.changePercentage ? current : best,
        );
      }

      if (liabilityPerformance.length > 0) {
        // For liabilities, lower or negative percentage is better (means reducing debt)
        worstPerformer = liabilityPerformance.reduce((worst, current) =>
          current.changePercentage > worst.changePercentage ? current : worst,
        );
      }

      return { bestPerformer, worstPerformer };
    },
    // These options can be adjusted based on your needs
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: accounts.length > 0,
  });

  return {
    bestPerformer: query.data?.bestPerformer ?? null,
    worstPerformer: query.data?.worstPerformer ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  };
}
