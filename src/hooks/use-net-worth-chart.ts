import { useState, useEffect, useRef } from "react";
import { useAdaptiveNetWorthHistory } from "@/hooks/networth/use-adaptive-networth-history";
import { TimeRange } from "@/types/networth";
import { useDb } from "@/components/DatabaseProvider";

interface ChartAccount {
  id: string;
  balance: number;
}

interface UseNetWorthChartResult {
  data: Array<{ date: string; value: number }>;
  events: Array<{ date: string; value: number }>;
  isLoading: boolean;
  isEmpty: boolean;
  error: Error | null;
  backendType: string;
}

const LOADING_DELAY_MS = 300;

export function useNetWorthChart(
  selectedRange: TimeRange,
  accounts: Array<ChartAccount>,
): UseNetWorthChartResult {
  const { backendType } = useDb();
  const [showLoading, setShowLoading] = useState(false);
  const backendRef = useRef(backendType);

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

  // Handle backend type changes
  useEffect(() => {
    if (backendRef.current !== backendType) {
      backendRef.current = backendType;
      refreshData();
      setShowLoading(false);
    }
  }, [backendType, refreshData]);

  // Refresh data when accounts change
  useEffect(() => {
    refreshData();
  }, [accounts, refreshData]);

  // Delayed loading state to prevent flickering
  useEffect(() => {
    const hasExistingData = data && data.length > 0;
    const timer = dataIsLoading && !hasExistingData
      ? window.setTimeout(() => setShowLoading(true), LOADING_DELAY_MS)
      : undefined;

    if (!dataIsLoading) {
      setShowLoading(false);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [dataIsLoading, data]);

  return {
    data: data || [],
    events: events || [],
    isLoading: showLoading && dataIsLoading,
    isEmpty: !dataIsLoading && (!data || data.length === 0),
    error,
    backendType,
  };
}
