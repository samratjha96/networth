import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Trophy } from "lucide-react";
import { CurrencyCode } from "./AccountsList";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

interface NetWorthSummaryProps {
  currentNetWorth: number;
  previousNetWorth: number;
  netWorthChange: number;
  changePercentage: number;
  period: string;
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
  period,
  currency,
  bestPerformingAccount,
}: NetWorthSummaryProps) {
  const isPositiveNetWorth = currentNetWorth >= 0;

  // For negative net worth, the interpretation is different:
  // - If absolute value decreases (gets less negative), it's positive
  // - If absolute value increases (gets more negative), it's negative
  const isPositiveChange = isPositiveNetWorth
    ? netWorthChange > 0 // For positive net worth, higher is better
    : netWorthChange > 0; // For negative net worth, less negative is better

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
              {period === "all"
                ? "since tracking began"
                : `over the last ${period}`}
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
              growth{" "}
              {period === "all"
                ? "since tracking began"
                : `over the last ${period}`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
