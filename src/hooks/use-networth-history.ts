import { useState, useEffect, useCallback } from "react";
import { NetworthHistory } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { useDatabaseStore } from "@/store/database-store";

export function useNetworthHistory(days: number, refreshDependency?: unknown) {
  const { db, currentBackend } = useDatabaseStore();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [data, setData] = useState<NetworthHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    // Don't try to fetch history if auth is still loading or user isn't set
    if (isAuthLoading || (!user && currentBackend === "supabase")) {
      console.debug("Skipping networth history fetch - waiting for auth", {
        isAuthLoading,
        hasUser: !!user,
        backend: currentBackend,
        days,
      });
      return;
    }

    console.debug("Fetching networth history:", {
      days,
      backend: currentBackend,
    });
    try {
      setIsLoading(true);
      const history = await db.getNetworthHistory(days);
      console.debug("Fetched history:", { length: history?.length ?? 0 });

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
  }, [days, db, currentBackend, user, isAuthLoading]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, currentBackend, refreshDependency, user]);

  return {
    data,
    isLoading: isLoading || (isAuthLoading && currentBackend === "supabase"),
    error,
    refetch: fetchHistory,
  };
}
