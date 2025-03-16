import { useState, useCallback } from "react";
import { TimeRange } from "@/types/networth";

type TimeRangeHook = [TimeRange, (range: TimeRange) => void];

/**
 * Hook for managing time range selection for networth history
 */
export function useTimeRange(initialRange: TimeRange = 30): TimeRangeHook {
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRange>(initialRange);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setSelectedTimeRange(range);
  }, []);

  return [selectedTimeRange, handleTimeRangeChange];
}
