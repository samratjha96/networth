import React from "react";
import { NetWorthChart } from "./NetWorthChart";
import { useDatabase } from "@/lib/database-context";
import { useNetworthHistory } from "@/hooks/use-networth-history";
import { CurrencyCode, TimeRange } from "@/types";
import { useAccounts } from "@/hooks/use-accounts";

export function NetWorthChartContainer() {
  const [timeRange, setTimeRange] = React.useState<TimeRange>(7); // Default to 1W
  const { isTestMode, db } = useDatabase();
  const { data } = useNetworthHistory(timeRange);
  const { accounts } = useAccounts();

  // Calculate current net worth from accounts
  const currentNetWorth = React.useMemo(() => {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }, [accounts]);

  // Handle time range change
  const handleTimeRangeChange = React.useCallback((days: TimeRange) => {
    setTimeRange(days);
  }, []);

  // Ensure networth history is synchronized with the current net worth
  React.useEffect(() => {
    if (accounts.length > 0) {
      db.synchronizeNetworthHistory();
    }
  }, [accounts, db]);

  return (
    <NetWorthChart
      currency="USD"
      currentNetWorth={currentNetWorth}
      onTimeRangeChange={handleTimeRangeChange}
      initialTimeRange={timeRange}
    />
  );
}
