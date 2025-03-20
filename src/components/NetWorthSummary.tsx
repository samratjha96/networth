import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Trophy } from "lucide-react";
import { TimeRange } from "@/types/networth";
import { useTimeRangeStore } from "@/store/time-range-store";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAccountsStore } from "@/store/accounts-store";
import { useAccountPerformance } from "@/hooks/use-account-performance";
import { useNetWorthHistory } from "@/hooks/use-networth-history";

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

// Simulate historical account data storage
interface HistoricalAccountData {
  [accountId: string]: {
    [timeKey: string]: number;
  };
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

// Get a key for storing historical data based on time range
const getTimeKey = (timeRange: TimeRange) => {
  return `history_${timeRange}`;
};

export function NetWorthSummary() {
  const { accounts } = useAccountsStore();
  const timeRange = useTimeRangeStore((state) => state.timeRange);
  const { formatWithCurrency } = useCurrencyFormatter("USD");

  // Calculate current net worth from accounts
  const currentNetWorth = accounts.reduce(
    (total, account) => total + account.balance,
    0,
  );

  // Use our hooks to get data
  const { bestPerformingAccount } = useAccountPerformance(accounts, timeRange);
  const netWorthData = useNetWorthHistory(currentNetWorth, timeRange);

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
