import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Trophy } from "lucide-react";
import { TimeRange } from "@/types/networth";
import { useTimeRangeStore } from "@/store/time-range-store";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAccountsStandard } from "@/hooks/accounts/use-accounts-standard";
import {
  useNetworthPerformance,
  useAccountPerformance,
} from "@/hooks/networth/use-networth-standard";
import { useAppData } from "@/hooks/app-context";
import { getPeriodLabel } from "@/utils/time-range";

export function NetWorthSummary() {
  const timeRange = useTimeRangeStore((state) => state.timeRange);
  const { formatWithCurrency } = useCurrencyFormatter("USD");

  // Get required dependencies
  const { dataService, userId } = useAppData();

  // Use standardized hooks
  const { netWorth } = useAccountsStandard({ userId, dataService });
  const networthPerformance = useNetworthPerformance({
    userId,
    dataService,
    timeRange,
  });
  const accountPerformance = useAccountPerformance({
    userId,
    dataService,
    timeRange,
  });

  // Map to the same data structure the component expects
  const netWorthData = {
    currentValue: networthPerformance.currentValue,
    previousValue: networthPerformance.previousValue,
    change: networthPerformance.change,
    percentageChange: networthPerformance.percentageChange,
  };
  const bestPerformingAccount = accountPerformance.bestPerforming;

  const isPositiveNetWorth = netWorth >= 0;
  const isPositiveChange = (netWorthData?.percentageChange ?? 0) > 0;

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
            {Math.abs(netWorthData.percentageChange).toFixed(2)}%
          </span>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              !isPositiveNetWorth ? "text-destructive" : ""
            }`}
          >
            {formatWithCurrency(netWorth)}
          </div>
          <p className="text-xs text-muted-foreground flex items-center">
            <span
              className={isPositiveChange ? "text-primary" : "text-destructive"}
            >
              {isPositiveChange ? "+" : ""}
              {formatWithCurrency(Math.abs(netWorthData.change))}
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
