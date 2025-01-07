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
  changePercentage,
  period,
  currency,
  bestPerformingAccount,
}: NetWorthSummaryProps) {
  const isPositiveNetWorth = currentNetWorth >= 0;
  const netWorthChange = currentNetWorth - previousNetWorth;

  // For negative net worth:
  // - If current is more negative than previous (e.g., -100 vs -90), it's getting worse
  // - If current is less negative than previous (e.g., -90 vs -100), it's getting better
  const isPositiveChange = isPositiveNetWorth
    ? currentNetWorth > previousNetWorth // For positive net worth, higher is better
    : currentNetWorth > previousNetWorth; // For negative net worth, less negative is better

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
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
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
          <p className="text-xs text-muted-foreground">
            {formatWithCurrency(netWorthChange)} from last {period}
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
            <p className="text-xs text-muted-foreground">
              +{bestPerformingAccount.changePercentage.toFixed(2)}% growth
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
