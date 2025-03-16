import React from "react";
import { NetWorthChart } from "./NetWorthChart";
import { useDatabase } from "@/hooks/use-database";
import { useNetworthHistory } from "@/hooks/use-networth-history";
import { CurrencyCode, TimeRange } from "@/types";
import { useAccounts } from "@/hooks/use-accounts";
import { useAuth } from "@/components/AuthProvider";

export function NetWorthChartContainer() {
  const [timeRange, setTimeRange] = React.useState<TimeRange>(7); // Default to 1W
  const { isTestMode, db, currentBackend } = useDatabase();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data } = useNetworthHistory(timeRange);
  const { accounts, isLoading: accountsLoading } = useAccounts();

  // Calculate current net worth from accounts
  const currentNetWorth = React.useMemo(() => {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }, [accounts]);

  // Handle time range change
  const handleTimeRangeChange = React.useCallback((days: TimeRange) => {
    setTimeRange(days);
  }, []);

  // Synchronize networth history with the current net worth only when
  // accounts are loaded and we're authenticated in Supabase mode
  React.useEffect(() => {
    const shouldSync =
      !isAuthLoading &&
      !accountsLoading &&
      accounts.length > 0 &&
      (user || currentBackend !== "supabase");

    if (shouldSync) {
      console.debug("Synchronizing networth history", {
        accountCount: accounts.length,
        currentNetWorth,
        backend: currentBackend,
      });
      db.synchronizeNetworthHistory();
    }
  }, [
    accounts,
    accountsLoading,
    db,
    isAuthLoading,
    user,
    currentBackend,
    currentNetWorth,
  ]);

  return (
    <NetWorthChart
      currency="USD"
      currentNetWorth={currentNetWorth}
      onTimeRangeChange={handleTimeRangeChange}
      initialTimeRange={timeRange}
    />
  );
}
