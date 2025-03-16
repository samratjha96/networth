import { useState, useEffect, useCallback } from "react";
import { useDb } from "@/components/DatabaseProvider";
import { Account } from "@/types/accounts";
import {
  AccountPerformance,
  PerformanceData,
  PerformancePeriod,
} from "@/types/performance";
import { calculateAccountPerformance } from "./use-performance-calculator";

/**
 * Hook for calculating account performance metrics
 */
export function useAccountPerformance(
  accounts: Account[],
  period: PerformancePeriod = "month",
): PerformanceData {
  const { db, backendType } = useDb();
  const [performance, setPerformance] = useState<PerformanceData>({
    bestPerformer: null,
    worstPerformer: null,
    isLoading: true,
    error: null,
  });

  const calculatePerformance = useCallback(async () => {
    if (!accounts || accounts.length === 0) {
      setPerformance({
        bestPerformer: null,
        worstPerformer: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      // Determine days based on period
      let days = 30; // Default to month
      switch (period) {
        case "day":
          days = 1;
          break;
        case "week":
          days = 7;
          break;
        case "month":
          days = 30;
          break;
        case "year":
          days = 365;
          break;
      }

      // Get performance data for each account
      const accountPerformance = await calculateAccountPerformance(
        accounts,
        days,
        db,
      );

      // Filter by asset and liability
      const assetPerformance = accountPerformance.filter(
        (account) => !account.isDebt,
      );
      const liabilityPerformance = accountPerformance.filter(
        (account) => account.isDebt,
      );

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

      setPerformance({
        bestPerformer,
        worstPerformer,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setPerformance({
        bestPerformer: null,
        worstPerformer: null,
        isLoading: false,
        error:
          err instanceof Error
            ? err
            : new Error("Failed to calculate account performance"),
      });
    }
  }, [accounts, period, db]);

  // Recalculate when dependencies change
  useEffect(() => {
    calculatePerformance();
  }, [calculatePerformance]);

  return performance;
}
