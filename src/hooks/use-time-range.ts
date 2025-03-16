import { useState, useEffect } from "react";
import { TimeRange } from "@/types";
import { useDb } from "@/components/DatabaseProvider";

const LOCAL_STORAGE_TIME_RANGE_KEY = "networth-time-range";

// Custom event for local storage updates
const TIME_RANGE_CHANGE_EVENT = "time-range-change";

export const useTimeRange = (initialValue: TimeRange = 7) => {
  const { backendType } = useDb();

  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const savedRange = localStorage.getItem(LOCAL_STORAGE_TIME_RANGE_KEY);
    return savedRange ? (Number(savedRange) as TimeRange) : initialValue;
  });

  // Reset to default time range when backend changes
  useEffect(() => {
    console.log(`Backend is ${backendType}, setting time range to default`);
    updateTimeRange(initialValue);
  }, [backendType, initialValue]);

  useEffect(() => {
    const handleTimeRangeChange = (event: CustomEvent) => {
      setTimeRange(event.detail as TimeRange);
    };

    // Listen for custom event
    window.addEventListener(
      TIME_RANGE_CHANGE_EVENT,
      handleTimeRangeChange as EventListener,
    );
    return () =>
      window.removeEventListener(
        TIME_RANGE_CHANGE_EVENT,
        handleTimeRangeChange as EventListener,
      );
  }, []);

  const updateTimeRange = (newTimeRange: TimeRange) => {
    localStorage.setItem(LOCAL_STORAGE_TIME_RANGE_KEY, newTimeRange.toString());
    setTimeRange(newTimeRange);

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent(TIME_RANGE_CHANGE_EVENT, { detail: newTimeRange }),
    );
  };

  return [timeRange, updateTimeRange] as const;
};
