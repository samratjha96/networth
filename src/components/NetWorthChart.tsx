import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Button } from "./ui/button";
import { CurrencyCode } from "./AccountsList";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNetworthHistory } from "@/hooks/use-networth-history";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

interface NetWorthChartProps {
  currency: CurrencyCode;
  currentNetWorth: number;
  onTimeRangeChange?: (days: number) => void;
  initialTimeRange?: number;
}

const TIME_RANGES = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "1Y", days: 365 },
  { label: "ALL", days: 0 },
] as const;

export function NetWorthChart({
  currency,
  currentNetWorth,
  onTimeRangeChange,
  initialTimeRange = 7,
}: NetWorthChartProps) {
  const [selectedRange, setSelectedRange] = React.useState(initialTimeRange);
  const isMobile = useIsMobile();
  const { data, isLoading } = useNetworthHistory(selectedRange);
  console.log("data is ", data, " and selected range is ", selectedRange);

  const handleRangeChange = (days: number) => {
    setSelectedRange(days);
    if (onTimeRangeChange) onTimeRangeChange(days);
  };

  // Only sync from parent when initialTimeRange changes
  React.useEffect(() => {
    if (initialTimeRange !== selectedRange) {
      setSelectedRange(initialTimeRange);
    }
  }, [initialTimeRange]); // Intentionally exclude selectedRange

  const formatWithCurrency = (value: number) => {
    const symbol = CURRENCY_SYMBOLS[currency];
    const formatted = formatCurrency(Math.abs(value)).replace(/^\$/, "");
    return value < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    if (selectedRange >= 365 || selectedRange === 0) {
      return date.toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });
    }

    if (selectedRange >= 7) {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }

    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Chart color based on net worth
  const chartColor =
    currentNetWorth < 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))";

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Net Worth Over Time</CardTitle>
          <div className="flex gap-1 sm:gap-2">
            {TIME_RANGES.map((range) => (
              <Button
                key={range.label}
                variant={selectedRange === range.days ? "default" : "outline"}
                size="sm"
                className="px-2 sm:px-4"
                onClick={() => handleRangeChange(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">
                No data available for the selected time range
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{
                  top: 10,
                  right: isMobile ? 10 : 30,
                  left: isMobile ? 20 : 40,
                  bottom: 10,
                }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartColor}
                      stopOpacity={0.8}
                    />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={isMobile ? 10 : 12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatDate}
                  minTickGap={isMobile ? 20 : 40}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={isMobile ? 10 : 12}
                  tickLine={false}
                  axisLine={false}
                  width={isMobile ? 60 : 80}
                  tickFormatter={formatWithCurrency}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value as number;
                      const date = new Date(payload[0].payload.date);
                      const formattedDate = date.toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: selectedRange === 1 ? "numeric" : undefined,
                        minute: selectedRange === 1 ? "numeric" : undefined,
                      });

                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                DATE
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {formattedDate}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                VALUE
                              </span>
                              <span
                                className={`font-bold ${value < 0 ? "text-destructive" : ""}`}
                              >
                                {formatWithCurrency(value)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
