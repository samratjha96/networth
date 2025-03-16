import { useState, useEffect, useCallback } from "react";
import { NetworthHistory } from "@/types";
import { useDatabase } from "@/lib/database-context";

export function useNetworthHistory(days: number, refreshDependency?: unknown) {
  const { db, currentBackend, initialized } = useDatabase();
  const [data, setData] = useState<NetworthHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!initialized) return;

    try {
      setIsLoading(true);
      setData([]); // Clear data while loading new history
      const history = await db.getNetworthHistory(days);
      setData(history);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch history"),
      );
      setData([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [days, db, initialized]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, currentBackend, initialized, refreshDependency]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}
