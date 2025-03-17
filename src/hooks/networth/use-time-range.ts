import { useState, useCallback } from "react";
import { TimeRange } from "@/types/networth";

type TimeRangeHook = [TimeRange, (range: TimeRange) => void];

export function useTimeRange(initialRange: TimeRange = 365): TimeRangeHook {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(() => {
    const stored = localStorage.getItem("selectedTimeRange");
    if (!stored) return initialRange;

    try {
      const { value, timestamp } = JSON.parse(stored);
      const ONE_DAY = 24 * 60 * 60 * 1000; // 1 day in milliseconds

      if (Date.now() - timestamp > ONE_DAY) {
        localStorage.removeItem("selectedTimeRange");
        return initialRange;
      }

      return Number(value) as TimeRange;
    } catch {
      return initialRange;
    }
  });

  const setTimeRangeWithStorage = (range: TimeRange) => {
    const data = {
      value: range.toString(),
      timestamp: Date.now(),
    };
    localStorage.setItem("selectedTimeRange", JSON.stringify(data));
    setSelectedTimeRange(range);
  };

  return [selectedTimeRange, setTimeRangeWithStorage];
}
