import { useDataSource } from "@/contexts/DataSourceContext";
import { NetworthHistory, TimeRange } from "@/types/networth";
import { getMockDataInstance } from "@/lib/mock-data";
import { useNetWorthChartData as useTanstackNetWorthChartData } from "@/api/queries";

export function useNetWorthChartData(timeRange: TimeRange) {
  const { dataSource, userId } = useDataSource();

  // Using Tanstack Query for remote data
  const { data: remoteData, isLoading } = useTanstackNetWorthChartData(
    dataSource === "remote" ? userId : null,
    timeRange,
  );

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
