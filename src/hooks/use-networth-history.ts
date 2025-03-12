import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/database";
import { NetworthHistory } from "@/lib/types";

export function useNetworthHistory(days: number, refreshDependency?: unknown) {
  const [data, setData] = useState<NetworthHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const database = await db;
      
      // Ensure the networth history is synchronized with the current account data
      await database.synchronizeNetworthHistory();
      
      const history = await database.getNetworthHistory(days);

      console.log('HOOK: Raw history data received:', 
        history.length > 0 ? 
        {
          totalEntries: history.length,
          firstEntry: history[0],
          lastEntry: history[history.length - 1],
          dataOrdering: history.length > 1 ? 
            (new Date(history[0].date) > new Date(history[history.length - 1].date) ? 
              'DESCENDING (newest first)' : 'ASCENDING (oldest first)') 
            : 'N/A (only one entry)'
        } : 'No data');

      // For "ALL", check if user has been around for at least 7 days
      if (days === 0 && history.length > 0) {
        const firstDate = new Date(history[0].date);
        const now = new Date();
        const daysSinceFirst = Math.floor((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

        // If user hasn't been around for 7 days, backfill 7 days
        if (daysSinceFirst < 7) {
          const currentValue = history[history.length - 1].value;
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);

          const backfilledData: NetworthHistory[] = [];
          const currentDate = new Date(startDate);

          while (currentDate <= endDate) {
            backfilledData.push({
              date: currentDate.toISOString(),
              value: currentValue
            });
            currentDate.setDate(currentDate.getDate() + 1);
          }

          setData(backfilledData);
          return;
        }
      }

      // For specific ranges, check if we have enough data points
      if (days > 0 && history.length < days + 1) {
        const currentValue = history.length > 0 ? history[history.length - 1].value : 0;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const backfilledData: NetworthHistory[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          backfilledData.push({
            date: currentDate.toISOString(),
            value: currentValue
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        setData(backfilledData);
      } else {
        setData(history);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load networth history'));
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
    refetch: fetchHistory
  };
}
