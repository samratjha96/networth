import React from "react";
import { NetWorthChart } from "./NetWorthChart";
import { useDatabase } from "@/lib/database-context";
import { useNetworthHistory } from "@/hooks/use-networth-history";
import { CurrencyCode } from "@/components/AccountsList";

export function NetWorthChartContainer() {
  const [timeRange, setTimeRange] = React.useState(7); // Default to 1W
  const { isTestMode } = useDatabase();
  const { data } = useNetworthHistory(timeRange);

  // Calculate current net worth from the latest data point
  const currentNetWorth = React.useMemo(() => {
    if (data && data.length > 0) {
      return data[data.length - 1].value;
    }
    return 0;
  }, [data]);

  // Handle time range change
  const handleTimeRangeChange = React.useCallback((days: number) => {
    setTimeRange(days);
  }, []);

  return (
    <NetWorthChart
      currency="USD"
      currentNetWorth={currentNetWorth}
      onTimeRangeChange={handleTimeRangeChange}
      initialTimeRange={timeRange}
    />
  );
}
