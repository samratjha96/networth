import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface NetWorthSummaryProps {
  currentNetWorth: number;
  previousNetWorth: number;
  changePercentage: number;
  period: string;
}

export function NetWorthSummary({ currentNetWorth, previousNetWorth, changePercentage, period }: NetWorthSummaryProps) {
  const isPositiveChange = changePercentage >= 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
        <span className={`flex items-center text-sm ${isPositiveChange ? 'text-primary' : 'text-destructive'}`}>
          {isPositiveChange ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {Math.abs(changePercentage)}%
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(currentNetWorth)}</div>
        <p className="text-xs text-muted-foreground">
          {isPositiveChange ? '+' : '-'} {formatCurrency(Math.abs(currentNetWorth - previousNetWorth))} from last {period}
        </p>
      </CardContent>
    </Card>
  );
}