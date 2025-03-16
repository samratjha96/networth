import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Button } from "./ui/button";
import { CurrencyCode, CURRENCY_SYMBOLS } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdaptiveNetWorthHistory } from "@/hooks/use-adaptive-networth-history";
import { TimeRange } from "@/types";
import { Info } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useTimeRange } from "@/hooks/use-time-range";
import { useDatabase } from "@/hooks/use-database";

const LOCAL_STORAGE_TIME_RANGE_KEY = "networth-time-range";

interface NetWorthChartProps {
  currency: CurrencyCode;
  currentNetWorth: number;
  onTimeRangeChange?: (days: number) => void;
  initialTimeRange?: TimeRange;
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
  initialTimeRange = 7 as TimeRange,
}: NetWorthChartProps) {
  const [selectedRange, setSelectedRange] = useTimeRange(initialTimeRange);
  const isMobile = useIsMobile();
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [showLoading, setShowLoading] = useState(false);

  const {
    data,
    events,
    isLoading: dataIsLoading,
    error,
  } = useAdaptiveNetWorthHistory(selectedRange, {
    includeEvents: true,
    eventThreshold: 3.0, // Only show events with 3% or more change
  });

  // Delayed loading state to prevent flickering
  useEffect(() => {
    let timer: number;
    if (dataIsLoading) {
      timer = window.setTimeout(() => setShowLoading(true), 500);
    } else {
      setShowLoading(false);
    }
    return () => window.clearTimeout(timer);
  }, [dataIsLoading]);

  // Show empty data instead of loading if we have no data but we're authenticated
  const isLoading = showLoading && dataIsLoading;
  const isEmpty = !isLoading && (!data || data.length === 0);

  const handleRangeChange = (days: TimeRange) => {
    setSelectedRange(days);
    if (onTimeRangeChange) onTimeRangeChange(days);
  };

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
                onClick={() => handleRangeChange(range.days as TimeRange)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]" ref={chartContainerRef}>
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-destructive">Error loading data</div>
            </div>
          ) : isEmpty ? (
            <div className="flex h-full items-center justify-center flex-col gap-2">
              <div className="text-muted-foreground">
                No data available for the selected time range
              </div>
              <p className="text-sm text-muted-foreground">
                Add or update accounts to start tracking your net worth
              </p>
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
                {events &&
                  events.length > 0 &&
                  events.map((event, index) => (
                    <ReferenceDot
                      key={`event-${index}`}
                      x={event.date}
                      y={event.value}
                      r={6}
                      fill={chartColor}
                      stroke="white"
                    />
                  ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {events && events.length > 0 && (
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-help">
                    <Info className="h-3 w-3 mr-1" />
                    <span>Dots represent significant changes in net worth</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>
                    These points indicate significant changes in your net worth
                    (3% or more) that might represent notable financial events.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
