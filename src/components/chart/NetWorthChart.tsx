import React, { useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { CurrencyCode } from "@/types/currency";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { TimeRange } from "@/types/networth";
import { Info } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useTimeRange } from "@/hooks/networth/use-time-range";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useNetWorthChart } from "@/hooks/use-net-worth-chart";
import { formatDateByRange } from "@/lib/date-formatters";
import { ChartLoading, ChartError, ChartEmpty } from "./NetWorthChartStates";
import { ChartTooltip } from "./ChartTooltip";
import { TimeRangeSelector } from "./TimeRangeSelector";

interface NetWorthChartProps {
  currency: CurrencyCode;
  currentNetWorth: number;
  onTimeRangeChange?: (days: number) => void;
  initialTimeRange?: TimeRange;
  accounts: Array<{ id: string; balance: number }>;
}

export function NetWorthChart({
  currency,
  currentNetWorth,
  onTimeRangeChange,
  initialTimeRange = 365 as TimeRange,
  accounts,
}: NetWorthChartProps) {
  const [selectedRange, setSelectedRange] = useTimeRange(initialTimeRange);
  const isMobile = useIsMobile();
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const { formatWithCurrency } = useCurrencyFormatter(currency);

  // Use our custom hook to handle chart data
  const { data, events, isLoading, isEmpty, error } = useNetWorthChart(
    selectedRange,
    accounts,
  );

  // Memoize the handler to prevent unnecessary recreations
  const handleRangeChange = useCallback(
    (days: TimeRange) => {
      setSelectedRange(days);
      if (onTimeRangeChange) onTimeRangeChange(days);
    },
    [onTimeRangeChange, setSelectedRange],
  );

  // Chart color based on net worth
  const chartColor =
    currentNetWorth < 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))";

  // Format date using our helper
  const formatDate = useCallback(
    (dateStr: string) => formatDateByRange(dateStr, selectedRange),
    [selectedRange],
  );

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Net Worth Over Time</CardTitle>
          <TimeRangeSelector
            selectedRange={selectedRange}
            onRangeChange={handleRangeChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]" ref={chartContainerRef}>
          {isLoading ? (
            <ChartLoading />
          ) : error ? (
            <ChartError message={error.message} />
          ) : isEmpty ? (
            <ChartEmpty />
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
                  tickFormatter={(value) => formatWithCurrency(value)}
                />
                <Tooltip
                  content={(props) => (
                    <ChartTooltip
                      {...props}
                      selectedRange={selectedRange}
                      formatValue={formatWithCurrency}
                    />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
                {events?.length > 0 &&
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

        {events?.length > 0 && (
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
