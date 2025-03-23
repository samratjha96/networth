import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Trophy } from "lucide-react";
import { TimeRange } from "@/types/networth";
import { useTimeRangeStore } from "@/store/time-range-store";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAccountPerformance } from "@/hooks/use-account-performance";
import {
  useNetWorthHistory,
  updateNetworthHistory,
} from "@/hooks/use-networth-history";
import { useEffect } from "react";
import { useAccounts } from "@/hooks/use-accounts";
import { useDataSource } from "@/contexts/DataSourceContext";

const getPeriodLabel = (days: TimeRange) => {
  switch (days) {
    case 1:
      return "24 hours";
    case 7:
      return "week";
    case 30:
      return "month";
    case 365:
      return "year";
    case 0:
      return "all time";
    default:
      return `${days} days`;
  }
};

export function NetWorthSummary() {
  const { accounts, isLoading } = useAccounts();
  const timeRange = useTimeRangeStore((state) => state.timeRange);
  const { formatWithCurrency } = useCurrencyFormatter("USD");
  const { dataSource, userId } = useDataSource();

  // Calculate current net worth from accounts
  const currentNetWorth = accounts.reduce(
    (total, account) => total + account.balance,
    0,
  );

  // Use our hooks to get data
  const { bestPerformingAccount } = useAccountPerformance(accounts, timeRange);
  const netWorthData = useNetWorthHistory(currentNetWorth, timeRange);

  // Debug logs
  useEffect(() => {
    console.log("[DEBUG] Accounts updated:", accounts);
    console.log("[DEBUG] Current Net Worth:", currentNetWorth);
  }, [accounts, currentNetWorth]);

  useEffect(() => {
    console.log("[DEBUG] NetWorth Data:", netWorthData);
  }, [netWorthData]);

  useEffect(() => {
    console.log("[DEBUG] TimeRange changed:", timeRange);
  }, [timeRange]);

  // Update networth history when current net worth changes and we're using remote data
  useEffect(() => {
    if (dataSource === "remote" && userId && accounts.length > 0) {
      console.log(
        "[DEBUG] NetWorthSummary triggering networth history update",
        currentNetWorth,
      );
      updateNetworthHistory(userId, currentNetWorth).catch((err) =>
        console.error(
          "[DEBUG] Failed to update networth history from component:",
          err,
        ),
      );
    }
  }, [currentNetWorth, dataSource, userId, accounts.length]);

  const isPositiveNetWorth = (netWorthData?.currentValue ?? 0) >= 0;
  const isPositiveChange = (netWorthData?.change ?? 0) > 0;

  // Debug render count
  useEffect(() => {
    console.log("[DEBUG] NetWorthSummary rendered");
    return () => {
      console.log("[DEBUG] NetWorthSummary unmounted");
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
          <span
            className={`flex items-center text-sm ${
              isPositiveChange ? "text-primary" : "text-destructive"
            }`}
          >
            {isPositiveChange ? (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            )}
            {Math.abs(netWorthData?.percentageChange ?? 0).toFixed(2)}%
          </span>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              !isPositiveNetWorth ? "text-destructive" : ""
            }`}
          >
            {formatWithCurrency(netWorthData?.currentValue ?? 0)}
          </div>
          <p className="text-xs text-muted-foreground flex items-center">
            <span
              className={isPositiveChange ? "text-primary" : "text-destructive"}
            >
              {isPositiveChange ? "+" : ""}
              {formatWithCurrency(Math.abs(netWorthData?.change ?? 0))}
            </span>
            <span className="ml-1">
              over the last {getPeriodLabel(timeRange)}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Best Performing Account
          </CardTitle>
          <Trophy className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {bestPerformingAccount ? (
            <>
              <div className="text-2xl font-bold">
                {bestPerformingAccount.account_name}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <span className="text-primary flex items-center mr-1">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  {(bestPerformingAccount?.percent_change ?? 0).toFixed(1)}%
                </span>
                growth over the last {getPeriodLabel(timeRange)}
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-muted-foreground">
                No accounts
              </div>
              <p className="text-xs text-muted-foreground">
                Add accounts to see performance
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
