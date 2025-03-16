import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Trophy } from "lucide-react";
import { CurrencyCode, TimeRange } from "@/types";
import { useTimeRange } from "@/hooks/use-time-range";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

const getPeriodLabel = (days: TimeRange) => {
  switch (days) {
    case 1: return "24 hours";
    case 7: return "week";
    case 30: return "month";
    case 365: return "year";
    case 0: return "all time";
    default: return `${days} days`;
  }
};

interface NetWorthSummaryProps {
  currentNetWorth: number;
  previousNetWorth: number;
  netWorthChange: number;
  changePercentage: number;
  currency: CurrencyCode;
  bestPerformingAccount?: {
    name: string;
    changePercentage: number;
  };
}

export function NetWorthSummary({
  currentNetWorth,
  previousNetWorth,
  netWorthChange,
  changePercentage,
  currency,
  bestPerformingAccount,
}: NetWorthSummaryProps) {
  const [timeRange] = useTimeRange();
  const isPositiveNetWorth = currentNetWorth >= 0;
  const isPositiveChange = isPositiveNetWorth
    ? netWorthChange > 0
    : netWorthChange > 0;

  const formatWithCurrency = (value: number) => {
    const symbol = CURRENCY_SYMBOLS[currency];
    const formatted = formatCurrency(Math.abs(value)).replace(/^\$/, "");
    return value < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
          <span
            className={`flex items-center text-sm ${isPositiveChange ? "text-primary" : "text-destructive"}`}
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
            className={`text-2xl font-bold ${!isPositiveNetWorth ? "text-destructive" : ""}`}
          >
            {formatWithCurrency(currentNetWorth)}
          </div>
          <p className="text-xs text-muted-foreground flex items-center">
            <span
              className={isPositiveChange ? "text-primary" : "text-destructive"}
            >
              {isPositiveChange ? "+" : "-"}
              {formatWithCurrency(Math.abs(netWorthChange))}
            </span>
            <span className="ml-1">
              over the last {getPeriodLabel(timeRange)}
            </span>
          </p>
        </CardContent>
      </Card>

      {bestPerformingAccount && (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Best Performing Account
            </CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
