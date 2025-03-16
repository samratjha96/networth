import { useState, useEffect, useCallback, useRef } from "react";
import { NetworthHistory } from "@/lib/types";
import { getDatabase } from "@/lib/database-factory";

export function useNetworthHistory(days: number, refreshDependency?: unknown) {
  const [data, setData] = useState<NetworthHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to store test mode status to avoid re-renders
  const isTestModeRef = useRef(getDatabase().isTestModeEnabled());

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = getDatabase();

      // Always synchronize history to ensure we have updated data
      // whether in test mode or not
      await db.synchronizeNetworthHistory();

      // Get history data for the specified time period
      const history = await db.getNetworthHistory(days);
      setData(history);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch history"));
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
