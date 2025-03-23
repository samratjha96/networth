import { useQuery } from "@tanstack/react-query";
import { useDataSource } from "@/contexts/DataSourceContext";
import { supabase } from "@/lib/supabase";
import { NetworthHistory, TimeRange } from "@/types/networth";
import { getMockDataInstance } from "@/lib/mock-data";
import { getStartDateForTimeRange } from "@/utils/time-range";

export function useNetWorthChartData(timeRange: TimeRange) {
  const { dataSource, userId } = useDataSource();

  // Fetch data from Supabase
  const fetchSupabaseData = async (): Promise<NetworthHistory[]> => {
    if (!userId) return [];

    try {
      const startDate = getStartDateForTimeRange(timeRange);
      const endDate = new Date();

      const { data, error } = await supabase
        .from("networth_history")
        .select("date, value")
        .eq("user_id", userId)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching networth history:", error);
      return [];
    }
  };

  // Use React Query for remote data
  const { data: remoteData, isLoading } = useQuery({
    queryKey: ["networth-chart-data", userId, timeRange],
    queryFn: fetchSupabaseData,
    enabled: dataSource === "remote" && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Return appropriate data based on data source
  if (dataSource === "remote") {
    return {
      networthHistory: remoteData || [],
      isLoading,
    };
  }

  // Use mock data for local mode
  const { networthHistory } = getMockDataInstance();
  return {
    networthHistory,
    isLoading: false,
  };
}
