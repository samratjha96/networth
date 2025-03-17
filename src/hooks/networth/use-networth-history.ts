import { useQuery } from "@tanstack/react-query";
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
  const { db } = useDb();

  const query = useQuery({
    queryKey: ["networthHistory", timeRange],
    queryFn: async () => {
      if (!db) return [];

      const days = timeRange === 0 ? 365 * 2 : timeRange;
      const history = await db.getNetworthHistory(days);

      return history.map((item) => ({
        date: item.date,
        value: item.value,
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!db,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refreshHistory: () => query.refetch(),
  };
}
