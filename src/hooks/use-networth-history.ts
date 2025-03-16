import { useState, useEffect, useCallback } from "react";
import { NetworthHistory } from "@/types";
import { useDatabase } from "@/lib/database-context";

export function useNetworthHistory(days: number, refreshDependency?: unknown) {
  const { db, isTestMode } = useDatabase();
  const [data, setData] = useState<NetworthHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      // Get history data for the specified time period
      const history = await db.getNetworthHistory(days);
      setData(history);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch history"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [days, db]);

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
