import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Trophy } from "lucide-react";
import { TimeRange } from "@/types/networth";
import { useTimeRangeStore } from "@/store/time-range-store";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/AuthProvider";
import { useNetWorthSummary } from "@/hooks/networth/use-networth-summary";

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
  const {
    currentNetWorth,
    netWorthChange,
    changePercentage,
    currency,
    bestPerformingAccount,
    isLoading,
  } = useNetWorthSummary();

  const timeRange = useTimeRangeStore((state) => state.timeRange);
  const isPositiveNetWorth = currentNetWorth >= 0;
  const isPositiveChange = netWorthChange > 0;
  const { formatWithCurrency } = useCurrencyFormatter(currency);
  const { user } = useAuth();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
          {!isLoading && (
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
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </>
          ) : (
            <>
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
            </>
          )}
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
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </>
          ) : bestPerformingAccount ? (
            <>
              <div className="text-2xl font-bold">
                {bestPerformingAccount.name}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <span className="text-primary flex items-center mr-1">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  {bestPerformingAccount.changePercentage.toFixed(2)}%
                </span>
                growth over the last {getPeriodLabel(timeRange)}
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-muted-foreground">
                {user ? "No accounts" : "Sign in"}
              </div>
              <p className="text-xs text-muted-foreground">
                {user
                  ? "Add accounts to see performance"
                  : "Sign in to see your data"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
