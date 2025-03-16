import { useState, useEffect, useCallback } from "react";
import { NetworthHistory } from "@/types";
import { useDb } from "@/components/DatabaseProvider";
import { useAuth } from "@/components/AuthProvider";

export function useNetworthHistory(days: number) {
  // Use auth and database access
  const { db, backendType } = useDb();

  const [data, setData] = useState<NetworthHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(
        `Fetching networth history for ${days} days, backend: ${backendType}`,
      );
      const history = await db.getNetworthHistory(days);

      // Only update state if the data is valid
      if (history) {
        setData(history);
        setError(null);
      } else {
        setData([]);
        setError(new Error("No history data received"));
      }
    } catch (err) {
      console.error("Error fetching networth history:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch history"),
      );
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [days, db, backendType]);

  // Fetch history when dependencies change
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    data,
    isLoading,
    error,
    refreshHistory: fetchHistory,
  };
}
