import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { TimeRange, NetWorthDataPoint, NetWorthEvent } from "@/types/networth";
import { useNetworthHistory } from "./use-networth-history";
import { useNetworthPoints } from "./use-networth-points";
import { useNetworthEvents } from "./use-networth-events";

interface UseAdaptiveNetWorthHistoryOptions {
  // Allow overriding the max points for special cases
  maxPoints?: number;
  // Include significant events as markers
  includeEvents?: boolean;
  // Custom threshold for significant events (percentage)
  eventThreshold?: number;
}

interface UseAdaptiveNetWorthHistoryResult {
  data: NetWorthDataPoint[];
  events: NetWorthEvent[];
  isLoading: boolean;
  error: Error | null;
  refreshData: () => void;
}

/**
 * Hook for managing adaptive networth history with optimal data point resolution
 */
export function useAdaptiveNetWorthHistory(
  timeRange: TimeRange,
  options: UseAdaptiveNetWorthHistoryOptions = {},
): UseAdaptiveNetWorthHistoryResult {
  const [adaptedData, setAdaptedData] = useState<NetWorthDataPoint[]>([]);
  const [events, setEvents] = useState<NetWorthEvent[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMobile = useIsMobile();

  // Get viewport width - use a ref to avoid unnecessary re-renders
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportWidth = isMobile ? window.innerWidth - 40 : 900; // Estimated default

  // Use the utility hooks
  const { optimizeDataPoints } = useNetworthPoints({
    maxPoints: options.maxPoints,
  });
  const { getEvents } = useNetworthEvents({
    eventThreshold: options.eventThreshold,
  });

  // Get base networth history data
  const {
    data,
    isLoading: isDataLoading,
    refreshHistory,
  } = useNetworthHistory(timeRange);

  // Process the data whenever it changes
  useEffect(() => {
    if (isDataLoading || !data) {
      return;
    }

    setIsProcessing(true);
    try {
      // Calculate timeRangeDays for resolution
      const timeRangeDays = timeRange === 0 ? 365 * 2 : timeRange;

      // Get optimized data points
      const sampledData = optimizeDataPoints(
        data,
        containerRef.current?.clientWidth || viewportWidth,
        timeRangeDays,
      );

      setAdaptedData(sampledData);

      // Extract significant events if requested
      if (options.includeEvents) {
        const significantEvents = getEvents(data);
        setEvents(significantEvents);
      }

      setError(null);
    } catch (err) {
      console.error("Error processing net worth history:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsProcessing(false);
    }
  }, [
    data,
    isDataLoading,
    timeRange,
    options.includeEvents,
    viewportWidth,
    optimizeDataPoints,
    getEvents,
  ]);

  // Effect to handle resize events
  useEffect(() => {
    const handleResize = () => {
      if (!data || data.length === 0) return;

      const currentWidth = containerRef.current?.clientWidth || 0;
      // Only reprocess if the container size has changed significantly
      if (Math.abs(currentWidth - viewportWidth) > 100) {
        const timeRangeDays = timeRange === 0 ? 365 * 2 : timeRange;

        const sampledData = optimizeDataPoints(
          data,
          currentWidth,
          timeRangeDays,
        );

        setAdaptedData(sampledData);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data, timeRange, viewportWidth, optimizeDataPoints]);

  return {
    data: adaptedData,
    events,
    isLoading: isDataLoading || isProcessing,
    error,
    refreshData: refreshHistory,
  };
}
