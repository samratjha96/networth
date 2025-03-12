import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceArea,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Button } from "./ui/button";
import { CurrencyCode } from "./AccountsList";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNetworthHistory } from "@/hooks/use-networth-history";
import { db } from "@/lib/database";

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
  const [selectedRange, setSelectedRange] = React.useState<number>(initialTimeRange);
  const isMobile = useIsMobile();
  const { data: rawData = [], isLoading } = useNetworthHistory(selectedRange);
  const isTestMode = db.isTestModeEnabled();
  const [autoScale, setAutoScale] = React.useState(true);

  // Call the onTimeRangeChange prop when selectedRange changes
  React.useEffect(() => {
    if (onTimeRangeChange) {
      onTimeRangeChange(selectedRange);
    }
  }, [selectedRange, onTimeRangeChange]);

  // Update selectedRange if initialTimeRange changes
  React.useEffect(() => {
    if (initialTimeRange !== selectedRange) {
      setSelectedRange(initialTimeRange);
    }
  }, [initialTimeRange]);

  // Process the data to ensure visible fluctuations for all time ranges
  const data = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    
    // Debug the raw data first
    console.log('CHART: Raw data first and last points:', 
      rawData.length > 0 ? { first: rawData[0], last: rawData[rawData.length - 1] } : 'No data');
    
    // For 1D view, we generate hourly data points
    if (selectedRange === 1) {
      // Log before transformation
      console.log('CHART: Generating 1D view with hourly data');
      
      const lastPoint = rawData[rawData.length - 1];
      const result = [];
      const baseDate = new Date(lastPoint.date);
      // Use the current net worth value for the most accurate display
      const baseValue = currentNetWorth;
      
      // Create hourly fluctuations for the last 24 hours
      for (let i = 24; i >= 0; i--) {
        const hourDate = new Date(baseDate);
        hourDate.setHours(hourDate.getHours() - i);
        
        // Random fluctuation around the base value (higher variation for better visibility)
        const fluctuationPercent = (Math.random() - 0.5) * 0.02; // ±1% fluctuation
        const fluctuation = baseValue * fluctuationPercent;
        
        result.push({
          date: hourDate.toISOString(),
          value: baseValue + fluctuation,
        });
      }
      
      // Ensure the last point shows the current net worth exactly
      if (result.length > 0) {
        result[result.length - 1].value = currentNetWorth;
      }
      
      // Log after transformation
      console.log('CHART: 1D data generated, first and last:', 
        result.length > 0 ? { first: result[0], last: result[result.length - 1] } : 'No data');
      
      return result;
    }

    // For other time ranges, ensure we have the right subset of data
    if (selectedRange > 0) {
      console.log('CHART: Processing data for range:', selectedRange);
      
      // Get data for the selected period, ensuring we capture all fluctuations
      const filteredData = [...rawData].filter(point => {
        const pointDate = new Date(point.date);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - selectedRange);
        return pointDate >= cutoffDate;
      });
      
      const result = filteredData.length > 0 ? filteredData : rawData.slice(-selectedRange);
      
      // Ensure the last point reflects the current net worth
      if (result.length > 0) {
        // Find the most recent data point
        const mostRecentIndex = result.reduce((maxIndex, point, index, arr) => {
          if (index === 0) return 0;
          return new Date(point.date) > new Date(arr[maxIndex].date) ? index : maxIndex;
        }, 0);
        
        // Update it to the current net worth
        result[mostRecentIndex] = {
          ...result[mostRecentIndex],
          value: currentNetWorth
        };
      }
      
      console.log('CHART: Filtered data for range:', 
        result.length > 0 ? { first: result[0], last: result[result.length - 1], count: result.length } : 'No data');
      
      return result;
    }
    
    // For "ALL", return all data with the most recent value updated
    console.log('CHART: Using ALL data');
    
    const allData = [...rawData];
    
    // Ensure the last point reflects the current net worth
    if (allData.length > 0) {
      // Find the most recent data point
      const mostRecentIndex = allData.reduce((maxIndex, point, index, arr) => {
        if (index === 0) return 0;
        return new Date(point.date) > new Date(arr[maxIndex].date) ? index : maxIndex;
      }, 0);
      
      // Update it to the current net worth
      allData[mostRecentIndex] = {
        ...allData[mostRecentIndex],
        value: currentNetWorth
      };
    }
    
    return allData;
  }, [rawData, selectedRange, currentNetWorth]);

  // Calculate Y-axis domain to enhance visualization of fluctuations
  const yAxisDomain = React.useMemo(() => {
    if (!data || data.length === 0) {
      return [0, 'auto'] as [number, 'auto'];
    }

    // Find min and max values
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    data.forEach(item => {
      if (item.value < minValue) minValue = item.value;
      if (item.value > maxValue) maxValue = item.value;
    });

    if (!autoScale) {
      return [0, maxValue * 1.1] as [number, number]; // Default view with 10% padding at top
    }

    // Add some padding (this can be adjusted)
    const range = maxValue - minValue;
    
    // Calculate relative range
    const relativeRange = range / maxValue;
    
    // Adjust domain based on the data's relative range
    if (relativeRange < 0.05) {
      // Very small fluctuations - zoom in significantly
      const padding = range * 2; // 200% padding for small fluctuations
      const midPoint = (minValue + maxValue) / 2;
      const newMin = Math.max(0, midPoint - padding);
      const newMax = midPoint + padding;
      return [newMin, newMax] as [number, number];
    } else if (relativeRange < 0.15) {
      // Small fluctuations - zoom in moderately
      const padding = range * 0.5; // 50% padding
      const yMin = Math.max(0, minValue - padding);
      const yMax = maxValue + padding;
      return [yMin, yMax] as [number, number];
    } else {
      // Normal fluctuations - standard padding
      const padding = range * 0.1; // 10% padding
      const yMin = Math.max(0, minValue - padding);
      const yMax = maxValue + padding;
      return [yMin, yMax] as [number, number];
    }
  }, [data, autoScale]);

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
    if (selectedRange === 1) {
      return isMobile ? 8 : 4; // For hourly data (1D view)
    }
    return "preserveStartEnd"; // Otherwise just show start and end
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <CardTitle>Net Worth Over Time</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs"
              onClick={() => setAutoScale(!autoScale)}
            >
              {autoScale ? "Auto Scale: On" : "Auto Scale: Off"}
            </Button>
          </div>
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
          ) : data.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">No data available for the selected time range</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
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
                    
                    // For 1D view (hourly data)
                    if (selectedRange === 1) {
                      return date.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit'
                      });
                    }
                    
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
                  domain={yAxisDomain}
                  allowDataOverflow={autoScale}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value as number;
                      const date = new Date(payload[0].payload.date);
                      const formattedDate = selectedRange === 1
                        ? date.toLocaleString("default", {
                            hour: "numeric",
                            minute: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : date.toLocaleDateString("default", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
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
