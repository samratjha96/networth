import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Trophy } from "lucide-react";
import { TimeRange } from "@/types/networth";
import { useTimeRangeStore } from "@/store/time-range-store";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getMockDataInstance } from "@/lib/mock-data";
import { useAccountsStore } from "@/store/accounts-store";

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
  const { accounts } = useAccountsStore();
  const { networthHistory } = getMockDataInstance();
  const timeRange = useTimeRangeStore((state) => state.timeRange);
  
  // Calculate current net worth
  const currentNetWorth = networthHistory[networthHistory.length - 1]?.value || 0;
  
  // Calculate change based on timeRange
  const timeRangeNumber = typeof timeRange === 'number' ? timeRange : 
    timeRange === 'day' ? 1 : 
    timeRange === 'week' ? 7 : 
    timeRange === 'month' ? 30 : 
    timeRange === 'year' ? 365 : 0;
    
  const pastIndex = Math.max(0, networthHistory.length - (timeRangeNumber || networthHistory.length));
  const pastNetWorth = networthHistory[pastIndex]?.value || 0;
  const netWorthChange = currentNetWorth - pastNetWorth;
  const changePercentage = pastNetWorth !== 0 
    ? (netWorthChange / Math.abs(pastNetWorth)) * 100 
    : 0;
  
  // Best performing account
  const bestPerformingAccount = accounts.length > 0 
    ? accounts.reduce((prev, current) => 
        (prev.balance > current.balance) ? prev : current
      ) 
    : null;
    
  const isPositiveNetWorth = currentNetWorth >= 0;
  const isPositiveChange = netWorthChange > 0;
  const { formatWithCurrency } = useCurrencyFormatter("USD");

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
            {Math.abs(changePercentage).toFixed(2)}%
          </span>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              !isPositiveNetWorth ? "text-destructive" : ""
            }`}
          >
            {formatWithCurrency(currentNetWorth)}
          </div>
          <p className="text-xs text-muted-foreground flex items-center">
            <span
              className={
                isPositiveChange ? "text-primary" : "text-destructive"
              }
            >
              {isPositiveChange ? "+" : ""}
              {formatWithCurrency(Math.abs(netWorthChange))}
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
                {bestPerformingAccount.name}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <span className="text-primary flex items-center mr-1">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  5.2%
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
