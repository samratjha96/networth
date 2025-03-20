import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Trophy } from "lucide-react";
import { TimeRange } from "@/types/networth";
import { useTimeRangeStore } from "@/store/time-range-store";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAccountsStore } from "@/store/accounts-store";

// This would come from a hook that fetches data from Supabase
// Based on the selected time range
interface NetWorthData {
  currentValue: number;
  previousValue: number;
  change: number;
  percentageChange: number;
}

// This would match the data from calculate_account_performance in Supabase
interface AccountPerformance {
  accountId: string;
  accountName: string;
  accountType: string;
  isDebt: boolean;
  startValue: number;
  endValue: number;
  absoluteChange: number;
  percentChange: number;
}

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
  const timeRange = useTimeRangeStore((state) => state.timeRange);
  const { formatWithCurrency } = useCurrencyFormatter("USD");

  // In a real implementation, this would be fetched from Supabase
  // using the networth_history table with the selected time range
  // For now, we'll simulate it with the same calculation
  const currentNetWorth = accounts.reduce(
    (total, account) => total + account.balance,
    0,
  );

  // This simulates what we would get from the Supabase query
  // In production, this would come from an API call to Supabase
  const netWorthData: NetWorthData = {
    currentValue: currentNetWorth,
    previousValue:
      currentNetWorth *
      (1 -
        (timeRange === 1
          ? 0.01
          : timeRange === 7
            ? 0.03
            : timeRange === 30
              ? 0.05
              : 0.08)),
    change:
      currentNetWorth *
      (timeRange === 1
        ? 0.01
        : timeRange === 7
          ? 0.03
          : timeRange === 30
            ? 0.05
            : 0.08),
    percentageChange:
      timeRange === 1 ? 1 : timeRange === 7 ? 3 : timeRange === 30 ? 5 : 8,
  };

  // This simulates the data we would get from the Supabase calculate_account_performance function
  // In production, this would be fetched from Supabase
  const accountPerformances: AccountPerformance[] = accounts.map((account) => ({
    accountId: account.id,
    accountName: account.name,
    accountType: account.type,
    isDebt: account.isDebt || false,
    startValue: account.balance * 0.9, // Simulated start value
    endValue: account.balance,
    absoluteChange: account.balance * 0.1,
    percentChange: 10, // Simulated 10% growth
  }));

  // Find best performing account - in production this would come directly from sorted query results
  const bestPerformingAccount =
    accounts.length > 0
      ? accountPerformances.sort((a, b) => b.percentChange - a.percentChange)[0]
      : null;

  const isPositiveNetWorth = netWorthData.currentValue >= 0;
  const isPositiveChange = netWorthData.change > 0;

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
            {formatWithCurrency(netWorthData.currentValue)}
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
                {bestPerformingAccount.accountName}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <span className="text-primary flex items-center mr-1">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  {bestPerformingAccount.percentChange.toFixed(1)}%
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
