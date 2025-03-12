import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/database";
import { NetworthHistory } from "@/lib/types";

export function useNetworthHistory(days: number, refreshDependency?: unknown) {
  const [data, setData] = useState<NetworthHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to store test mode status to avoid re-renders
  const isTestModeRef = useRef(db.isTestModeEnabled());

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const database = await db;

      // Always synchronize history to ensure we have updated data
      // whether in test mode or not
      await database.synchronizeNetworthHistory();

      const history = await database.getNetworthHistory(days);

      // Ensure we have data points sorted by date before sampling
      const sortedHistory = [...history].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Sample data points based on the selected time range
      let sampledData = sortedHistory;

      // Minimum number of data points we want to display (if available)
      const MIN_DATA_POINTS = 7;

      // Only sample if we have more than MIN_DATA_POINTS
      if (sortedHistory.length > MIN_DATA_POINTS) {
        // For 1D, show hourly data points or at least MIN_DATA_POINTS
        if (days === 1) {
          // If we have too many points for 1D, sample them
          if (sortedHistory.length > 24) {
            const interval = Math.floor(sortedHistory.length / 24);
            sampledData = sortedHistory.filter(
              (_, index) => index % interval === 0,
            );
            // Ensure we include the last point
            if (
              sampledData[sampledData.length - 1] !==
              sortedHistory[sortedHistory.length - 1]
            ) {
              sampledData.push(sortedHistory[sortedHistory.length - 1]);
            }
          }
        }
        // For 1W, ensure enough points for a weekly view
        else if (days === 7) {
          // Aim for at least 7 points (one per day) or more if data permits
          const targetPoints = Math.max(
            MIN_DATA_POINTS,
            Math.min(sortedHistory.length, 14),
          );
          const interval = Math.floor(sortedHistory.length / targetPoints);
          sampledData =
            interval > 1
              ? sortedHistory.filter((_, index) => index % interval === 0)
              : sortedHistory;

          // Ensure we include the last point
          if (
            sampledData[sampledData.length - 1] !==
            sortedHistory[sortedHistory.length - 1]
          ) {
            sampledData.push(sortedHistory[sortedHistory.length - 1]);
          }
        }
        // For 1M, sample daily data points
        else if (days === 30) {
          // Group by day and take the last point of each day
          const dailyData: Record<string, NetworthHistory> = {};
          sortedHistory.forEach((point) => {
            const date = new Date(point.date);
            const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            dailyData[dayKey] = point;
          });
          sampledData = Object.values(dailyData);

          // If we still have too many points, sample them further
          if (sampledData.length > 30) {
            const interval = Math.floor(sampledData.length / 30);
            sampledData = sampledData.filter(
              (_, index) => index % interval === 0,
            );
          }
        }
        // For 1Y or ALL, sample weekly or monthly data points
        else if (days === 365 || days === 0) {
          // Group by week and take the last point of each week
          const weeklyData: Record<string, NetworthHistory> = {};
          sortedHistory.forEach((point) => {
            const date = new Date(point.date);
            const weekKey = `${date.getFullYear()}-${Math.floor((date.getDate() + date.getDay()) / 7)}`;
            weeklyData[weekKey] = point;
          });
          sampledData = Object.values(weeklyData);

          // If we have too few points, use the original data with sampling
          if (
            sampledData.length < MIN_DATA_POINTS &&
            sortedHistory.length > MIN_DATA_POINTS
          ) {
            const interval = Math.floor(sortedHistory.length / MIN_DATA_POINTS);
            sampledData = sortedHistory.filter(
              (_, index) => index % interval === 0,
            );
          }
        }
      }

      // Ensure final data is sorted by date
      sampledData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      setData(sampledData);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to load networth history"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshDependency]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}
