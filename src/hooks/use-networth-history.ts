import { useState, useEffect, useCallback } from "react";
import { NetworthHistory } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import { useDatabase } from "@/hooks/use-database";

export function useNetworthHistory(days: number, refreshDependency?: unknown) {
  // Destructure only what we need from hooks
  const { db } = useDatabase();
  const { user, isLoading: isAuthLoading, databaseMode } = useAuthStore();

  const [data, setData] = useState<NetworthHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    // Don't try to fetch history if auth is still loading or user isn't set
    if (isAuthLoading || (!user && databaseMode === "supabase")) {
      console.debug("Skipping networth history fetch - waiting for auth", {
        isAuthLoading,
        hasUser: !!user,
        mode: databaseMode,
        days,
      });
      return;
    }

    console.debug("Fetching networth history:", {
      days,
      mode: databaseMode,
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
  }, [days, db, databaseMode, user, isAuthLoading]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, databaseMode, refreshDependency, user]);

  // Compute a value to pass to chart components
  const chartData = data.map((item) => ({
    x: new Date(item.date),
    y: item.value,
  }));

  return {
    data,
    chartData,
    isLoading,
    error,
    refreshHistory: fetchHistory,
  };
}
