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
  hasAccounts?: boolean;
  currency: CurrencyCode;
  currentNetWorth: number;
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
}: NetWorthChartProps) {
  const [selectedRange, setSelectedRange] = React.useState<number>(30); // Default to 1M
  const isMobile = useIsMobile();
  const { data = [], isLoading } = useNetworthHistory(selectedRange);

  const filteredData = React.useMemo(() => {
    if (selectedRange === 0) return data; // ALL
    return data.slice(-(selectedRange + 1));
  }, [data, selectedRange]);

  const isNegative = currentNetWorth < 0;

  const formatWithCurrency = (value: number) => {
    const symbol = CURRENCY_SYMBOLS[currency];
    const formatted = formatCurrency(Math.abs(value)).replace(/^\$/, "");
    return value < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  };

  // Calculate interval based on range and screen size
  const getInterval = () => {
    if (selectedRange === 365 || selectedRange === 0) {
      return isMobile ? 90 : 30; // Show quarterly/monthly ticks
    }
    if (selectedRange === 30) {
      return isMobile ? 7 : 3; // Show weekly/tri-daily ticks
    }
    if (selectedRange === 7) {
      return isMobile ? 3 : 1; // Show every third/every day
    }
    return "preserveStartEnd"; // For 1D, just show start and end
  };

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
                onClick={() => setSelectedRange(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-0 sm:pl-2">
        <div className="h-[400px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{
                  top: 5,
                  right: isMobile ? 10 : 30,
                  left: isMobile ? 10 : 20,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={
                        isNegative
                          ? "hsl(var(--destructive))"
                          : "hsl(var(--primary))"
                      }
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={
                        isNegative
                          ? "hsl(var(--destructive))"
                          : "hsl(var(--primary))"
                      }
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={isMobile ? 10 : 12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(dateStr) => {
                    const date = new Date(dateStr);
                    const month = date.toLocaleString("default", {
                      month: "short",
                    });
                    const day = date.getDate();
                    const year = date.getFullYear().toString().slice(-2);

                    // For 1Y and ALL views, show Month YY
                    if (selectedRange === 365 || selectedRange === 0) {
                      return isMobile
                        ? `${month} ${year}`
                        : `${month}\n${year}`;
                    }

                    // For shorter ranges, show DD Month
                    return isMobile ? `${day} ${month}` : `${day}\n${month}`;
                  }}
                  height={40}
                  interval={getInterval()}
                  minTickGap={isMobile ? 30 : 50}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={isMobile ? 10 : 12}
                  tickLine={false}
                  axisLine={false}
                  width={isMobile ? 60 : 80}
                  tickFormatter={(value) => formatWithCurrency(value)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value as number;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Date
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {new Date(
                                  payload[0].payload.date,
                                ).toLocaleDateString("default", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Value
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
                  stroke={
                    isNegative
                      ? "hsl(var(--destructive))"
                      : "hsl(var(--primary))"
                  }
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
