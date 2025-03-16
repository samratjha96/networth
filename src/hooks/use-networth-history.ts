import { useState, useEffect, useCallback } from "react";
import { NetworthHistory } from "@/types";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/components/AuthProvider";

export function useNetworthHistory(days: number, refreshDependency?: unknown) {
  // Use auth from AuthProvider and simplified database hook
  const { db, backendType } = useDatabase();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [data, setData] = useState<NetworthHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    // Only wait for auth if using Supabase
    const isUsingSupabase = backendType === "supabase";

    // Don't try to fetch history if auth is still loading or user isn't set when using Supabase
    if (isAuthLoading || (!user && isUsingSupabase)) {
      console.debug("Skipping networth history fetch - waiting for auth", {
        isAuthLoading,
        hasUser: !!user,
        backendType,
        days,
      });
      return;
    }

    console.debug("Fetching networth history:", {
      days,
      backendType,
      userId: user?.id,
    });
    try {
      setIsLoading(true);
      const history = await db.getNetworthHistory(days);
      console.debug("Fetched history:", {
        length: history?.length ?? 0,
        firstValue: history && history.length > 0 ? history[0].value : null,
        lastValue:
          history && history.length > 0
            ? history[history.length - 1].value
            : null,
      });

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
  }, [days, db, backendType, user, isAuthLoading]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, backendType, refreshDependency, user]);

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
