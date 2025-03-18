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
  const { db, isLoading: dbLoading, backendType } = useDb();

  const query = useQuery({
    queryKey: ["networthHistory", timeRange, backendType],
    queryFn: async () => {
      if (!db || !db.getNetworthHistory) {
        console.log("Database not ready or missing getNetworthHistory method");
        return [];
      }

      try {
        const days = convertTimeRangeToDays(timeRange);
        console.log(
          `Fetching networth history for ${days} days using ${backendType} backend`,
        );
        const history = await db.getNetworthHistory(days);

        return history.map((item) => ({
          date: item.date,
          value: item.value,
        }));
      } catch (error) {
        console.error("Error fetching networth history:", error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Only enable the query when the database is available and not loading
    enabled: !dbLoading && !!db && !!db.getNetworthHistory,
    // When backend type changes, refetch data automatically
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data ?? [],
    // We're loading if the database is loading or the query is loading
    isLoading: dbLoading || query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refreshHistory: () => query.refetch(),
  };
}
