import { useState, useEffect, useCallback } from "react";
import { TimeRange, NetWorthDataPoint } from "@/types/networth";
import { useDb } from "@/components/DatabaseProvider";

interface UseNetworthHistoryResult {
  data: NetWorthDataPoint[];
  isLoading: boolean;
  error: Error | null;
  refreshHistory: () => void;
}

/**
 * Hook to fetch networth history data for a specific time range
 */
export function useNetworthHistory(
  timeRange: TimeRange,
): UseNetworthHistoryResult {
  const [data, setData] = useState<NetWorthDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { db } = useDb();

  const fetchData = useCallback(async () => {
    if (!db) return;

    setIsLoading(true);
    try {
      // Convert TimeRange to days
      const days = timeRange === 0 ? 365 * 2 : timeRange;

      // Get data from database
      const history = await db.getNetworthHistory(days);

      // Convert to NetWorthDataPoint format
      const formattedData: NetWorthDataPoint[] = history.map((item) => ({
        date: item.date,
        value: item.value,
      }));

      setData(formattedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching networth history:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [db, timeRange]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refreshHistory: fetchData,
  };
}
