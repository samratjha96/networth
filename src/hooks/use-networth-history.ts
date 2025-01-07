import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/database";
import { NetworthHistory } from "@/lib/types";

export function useNetworthHistory(days: number) {
  const [data, setData] = useState<NetworthHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const database = await db;
      const history = await database.getNetworthHistory(days);
      setData(history);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load networth history'));
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchHistory
  };
}
