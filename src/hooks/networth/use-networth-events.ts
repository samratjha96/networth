import { useCallback } from "react";
import { NetWorthDataPoint, NetWorthEvent } from "@/types/networth";
import { getSignificantEvents } from "@/lib/adaptive-resolution";

interface UseNetworthEventsOptions {
  // Threshold for significant events (percentage)
  eventThreshold?: number;
}

interface UseNetworthEventsResult {
  getEvents: (data: NetWorthDataPoint[]) => NetWorthEvent[];
}

/**
 * Hook for detecting significant events in networth history
 */
export function useNetworthEvents(
  options: UseNetworthEventsOptions = {},
): UseNetworthEventsResult {
  // Function to extract significant events
  const getEvents = useCallback(
    (data: NetWorthDataPoint[]): NetWorthEvent[] => {
      if (!data || data.length === 0) return [];

      const significantEvents = getSignificantEvents(
        data,
        options.eventThreshold || 2.0,
      );

      // Convert to NetWorthEvent format
      return significantEvents.map((point) => ({
        date: point.date,
        value: point.value,
        type: "market_change", // Default type
        description: point.metadata?.changePercentage
          ? `Net worth changed by ${point.metadata.changePercentage.toFixed(2)}%`
          : "Significant change detected",
      }));
    },
    [options.eventThreshold],
  );

  return { getEvents };
}
