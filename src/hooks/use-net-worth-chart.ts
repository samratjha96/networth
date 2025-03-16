import { useState, useEffect, useRef } from "react";
import { useAdaptiveNetWorthHistory } from "./use-adaptive-networth-history";
import { TimeRange } from "@/types";

// Minimal account interface needed for the chart
type ChartAccount = {
  id: string;
  balance: number;
};

export function useNetWorthChart(
  selectedRange: TimeRange,
  accounts: Array<ChartAccount>,
) {
  const [showLoading, setShowLoading] = useState(false);

  // Get the chart data with events
  const {
    data,
    events,
    isLoading: dataIsLoading,
    error,
    refreshData,
  } = useAdaptiveNetWorthHistory(selectedRange, {
    includeEvents: true,
    eventThreshold: 3.0, // Only show events with 3% or more change
  });

  // Refresh data when accounts change
  useEffect(() => {
    refreshData();
  }, [accounts, refreshData]);

  // Delayed loading state to prevent flickering
  useEffect(() => {
    let timer: number;
    if (dataIsLoading) {
      timer = window.setTimeout(() => setShowLoading(true), 500);
    } else {
      setShowLoading(false);
    }
    return () => window.clearTimeout(timer);
  }, [dataIsLoading]);

  // Calculate loading and empty states
  const isLoading = showLoading && dataIsLoading;
  const isEmpty = !isLoading && (!data || data.length === 0);

  return {
    data,
    events,
    isLoading,
    isEmpty,
    error,
  };
}
