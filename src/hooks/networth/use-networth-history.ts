import { useQuery } from "@tanstack/react-query";
import { TimeRange, NetWorthDataPoint } from "@/types/networth";
import { useDb } from "@/components/DatabaseProvider";

interface UseNetworthHistoryResult {
  data: NetWorthDataPoint[];
  isLoading: boolean;
  error: Error | null;
  refreshHistory: () => void;
}

// Convert TimeRange to numerical days
const convertTimeRangeToDays = (range: TimeRange): number => {
  if (typeof range === "number") return range;

  switch (range) {
    case "day":
      return 1;
    case "week":
      return 7;
    case "month":
      return 30;
    case "year":
      return 365;
    case "all":
      return 365 * 2;
    default:
      return 30;
  }
};

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

      const days = convertTimeRangeToDays(timeRange);
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
