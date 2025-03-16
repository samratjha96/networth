import { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "./use-mobile";
import { NetWorthDataPoint, TimeRange, NetWorthEvent } from "@/types";
import {
  getOptimalResolution,
  sampleDataPoints,
  getSignificantEvents,
} from "@/lib/adaptive-resolution";
import { useNetworthHistory } from "./use-networth-history";

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

  // Use the existing networth history hook to get data from your database
  const {
    data,
    isLoading: isDataLoading,
    refreshHistory,
  } = useNetworthHistory(timeRange);

  // Debug logging
  useEffect(() => {
    console.debug("NetWorthChart state:", {
      timeRange,
      dataLength: data?.length ?? 0,
      isDataLoading,
      isProcessing,
      hasError: !!error,
    });
  }, [data, timeRange, isDataLoading, isProcessing, error]);

  // Process the data whenever it changes
  useEffect(() => {
    if (isDataLoading) {
      console.debug("Skipping processing - data is still loading");
      return;
    }

    if (!data) {
      console.debug("No data available");
      setAdaptedData([]);
      setEvents([]);
      return;
    }

    console.debug("Processing data:", { length: data.length });
    setIsProcessing(true);
    try {
      // Determine optimal resolution based on viewport width and time range
      const resolution = getOptimalResolution(
        containerRef.current?.clientWidth || viewportWidth,
        timeRange === 0 ? 365 * 2 : timeRange, // Default "ALL" to 2 years for resolution calc
      );

      // Sample data based on resolution
      const sampledData = sampleDataPoints(data, resolution, options.maxPoints);
      console.debug("Sampled data:", { length: sampledData.length });

      setAdaptedData(sampledData);

      // Extract significant events if requested
      if (options.includeEvents) {
        const significantEvents = getSignificantEvents(
          data,
          options.eventThreshold || 2.0,
        );

        // Convert to NetWorthEvent format
        const formattedEvents: NetWorthEvent[] = significantEvents.map(
          (point) => ({
            date: point.date,
            value: point.value,
            type: "market_change", // Default type
            description: point.metadata?.changePercentage
              ? `Net worth changed by ${point.metadata.changePercentage.toFixed(2)}%`
              : "Significant change detected",
          }),
        );

        setEvents(formattedEvents);
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
    options.eventThreshold,
    options.maxPoints,
    viewportWidth,
  ]);

  // Effect to handle resize events
  useEffect(() => {
    const handleResize = () => {
      const currentWidth = containerRef.current?.clientWidth || 0;
      // Only reprocess if the container size has changed significantly
      if (
        Math.abs(currentWidth - viewportWidth) > 100 &&
        data &&
        data.length > 0
      ) {
        // Recalculate with new viewport width
        const resolution = getOptimalResolution(
          currentWidth,
          timeRange === 0 ? 365 * 2 : timeRange,
        );

        const sampledData = sampleDataPoints(
          data,
          resolution,
          options.maxPoints,
        );

        setAdaptedData(sampledData);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data, timeRange, options.maxPoints, viewportWidth]);

  // Function to refresh data
  const refreshData = useCallback(() => {
    refreshHistory();
  }, [refreshHistory]);

  return {
    data: adaptedData,
    events,
    isLoading: isDataLoading || isProcessing,
    error,
    refreshData,
  };
}
