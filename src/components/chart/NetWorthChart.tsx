import React, { useRef } from "react";
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
import { Info } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTimeRangeStore } from "@/store/time-range-store";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { formatDateByRange } from "@/lib/date-formatters";
import { ChartLoading, ChartError, ChartEmpty } from "./NetWorthChartStates";
import { ChartTooltip } from "./ChartTooltip";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { getMockDataInstance } from "@/lib/mock-data";

interface NetWorthChartProps {
  currency: CurrencyCode;
  currentNetWorth: number;
  accounts: Array<{ id: string; balance: number }>;
  isLoading?: boolean;
}

export function NetWorthChart({
  currency,
  currentNetWorth,
  accounts,
  isLoading,
}: NetWorthChartProps) {
  const timeRange = useTimeRangeStore((state) => state.timeRange);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const { formatWithCurrency } = useCurrencyFormatter(currency);
  const { networthHistory } = getMockDataInstance();
  
  // Filter data based on time range
  const filteredData = (() => {
    const timeRangeNumber = typeof timeRange === 'number' ? timeRange : 
      timeRange === 'day' ? 1 : 
      timeRange === 'week' ? 7 : 
      timeRange === 'month' ? 30 : 
      timeRange === 'year' ? 365 : 0;
    
    if (timeRangeNumber === 0) {
      return networthHistory;
    }
    
    const cutoffIndex = Math.max(0, networthHistory.length - timeRangeNumber);
    return networthHistory.slice(cutoffIndex);
  })();
  
  // Generate some event points (significant changes)
  const events = filteredData.length > 5 ? 
    [filteredData[Math.floor(filteredData.length * 0.33)], filteredData[Math.floor(filteredData.length * 0.66)]] : 
    [];

  // Chart color based on net worth
  const chartColor =
    currentNetWorth < 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))";

  // Format date for display
  const formatDate = (dateStr: string) => formatDateByRange(dateStr, timeRange);

  // Render the appropriate chart state
  const renderChartContent = () => {
    if (isLoading) return <ChartLoading />;
    if (!filteredData || filteredData.length === 0) return <ChartEmpty />;

    const isMobile = window.innerWidth < 768;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={filteredData}
          margin={{
            top: 10,
            right: isMobile ? 10 : 30,
            left: isMobile ? 20 : 40,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
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
                selectedRange={timeRange}
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
    );
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Net Worth Over Time</CardTitle>
          <TimeRangeSelector />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]" ref={chartContainerRef}>
          {renderChartContent()}
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
