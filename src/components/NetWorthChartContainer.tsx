import React from "react";
import { NetWorthChart } from "./NetWorthChart";
import { getDatabase } from "@/lib/database-factory";
import { useNetworthHistory } from "@/hooks/use-networth-history";
import { CurrencyCode } from "@/components/AccountsList";

export function NetWorthChartContainer() {
  const [timeRange, setTimeRange] = React.useState(7); // Default to 1W

  // Use a ref to track initialization state instead of state to avoid re-renders
  const initializedRef = React.useRef(false);

  // Get the test mode status once during component mount
  const isTestModeRef = React.useRef(getDatabase().isTestModeEnabled());

  const { data } = useNetworthHistory(timeRange);

  // Initialize mock data once using useEffect with empty dependency array
  React.useEffect(() => {
    const initializeData = async () => {
      // Only initialize once and only in test mode
      if (!initializedRef.current && isTestModeRef.current) {
        const db = getDatabase();
        await db.synchronizeNetworthHistory();
        initializedRef.current = true;
      }
    };

    initializeData();
  }, []);

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
