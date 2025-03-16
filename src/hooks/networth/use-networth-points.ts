import { useCallback, useState } from "react";
import { NetWorthDataPoint } from "@/types/networth";
import {
  sampleDataPoints,
  getOptimalResolution,
} from "@/lib/adaptive-resolution";

interface UseNetworthPointsOptions {
  maxPoints?: number;
}

interface UseNetworthPointsResult {
  optimizeDataPoints: (
    data: NetWorthDataPoint[],
    viewportWidth: number,
    timeRangeDays: number,
  ) => NetWorthDataPoint[];
}

/**
 * Hook for optimizing networth data points for efficient chart rendering
 */
export function useNetworthPoints(
  options: UseNetworthPointsOptions = {},
): UseNetworthPointsResult {
  // Function to optimize data points based on resolution
  const optimizeDataPoints = useCallback(
    (
      data: NetWorthDataPoint[],
      viewportWidth: number,
      timeRangeDays: number,
    ): NetWorthDataPoint[] => {
      if (!data || data.length === 0) return [];

      // Determine optimal resolution based on viewport width and time range
      const resolution = getOptimalResolution(viewportWidth, timeRangeDays);

      // Sample data based on resolution
      return sampleDataPoints(data, resolution, options.maxPoints);
    },
    [options.maxPoints],
  );

  return { optimizeDataPoints };
}
