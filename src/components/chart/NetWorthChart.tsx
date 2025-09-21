import React, { useRef, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
  LineChart,
  Line,
  CartesianGrid,
  ReferenceLine,
  Label,
  TooltipProps,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import { CurrencyCode } from "@/types/currency";
import {
  Info,
  BarChart2,
  LineChart as LineChartIcon,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTimeRangeStore } from "@/store/time-range-store";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { formatDateByRange } from "@/lib/date-formatters";
import {
  ChartLoading,
  ChartEmpty,
} from "@/components/chart/NetWorthChartStates";
import { ChartTooltip } from "./ChartTooltip";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { useAppNetWorthChart } from "@/hooks/app-data";

type ChartType = "area" | "line" | "bar";

interface NetWorthChartProps {
  currency: CurrencyCode;
}

export function NetWorthChart({ currency }: NetWorthChartProps) {
  const [chartType, setChartType] = useState<ChartType>("area");
  const [showFilledIndicator, setShowFilledIndicator] = useState<boolean>(true);
  const timeRange = useTimeRangeStore((state) => state.timeRange);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const { formatWithCurrency } = useCurrencyFormatter(currency);
  const isMobile = useIsMobile();

  // Use our centralized data hook for chart data
  // Pass the timeRange directly since the hook expects TimeRange type
  const {
    networthHistory,
    rawNetWorthHistory,
    isLoading,
    currentNetWorth,
    dataStats,
  } = useAppNetWorthChart(timeRange);

  // Create a map of real data points for quick lookup
  const realDataPointsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    rawNetWorthHistory.forEach((point) => {
      map.set(point.date, true);
    });
    return map;
  }, [rawNetWorthHistory]);

  // Generate some event points (significant changes)
  const events =
    networthHistory.length > 5
      ? [
          networthHistory[Math.floor(networthHistory.length * 0.33)],
          networthHistory[Math.floor(networthHistory.length * 0.66)],
        ]
      : [];

  // Calculate average value for trend line
  const averageValue = useMemo(() => {
    if (!networthHistory.length) return 0;
    const sum = networthHistory.reduce((acc, item) => acc + item.value, 0);
    return sum / networthHistory.length;
  }, [networthHistory]);

  // Chart color based on net worth
  const chartColor =
    currentNetWorth < 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))";

  // Format date for display
  const formatDate = (dateStr: string) => formatDateByRange(dateStr, timeRange);

  // Format currency for mobile
  const formatCurrency = (value: number) => {
    if (isMobile) {
      const absValue = Math.abs(value);
      if (absValue >= 1000000) {
        return formatWithCurrency(value / 1000000).replace(/\.00$/, "") + "M";
      }
      if (absValue >= 1000) {
        return formatWithCurrency(value / 1000).replace(/\.00$/, "") + "K";
      }
    }
    return formatWithCurrency(value);
  };

  // Memoize axis props to prevent recreation on every render
  // Only recompute when dependencies like isMobile, formatDate, formatCurrency change
  const commonAxisProps = useMemo(
    () => ({
      xAxis: {
        dataKey: "date",
        stroke: "hsl(var(--muted-foreground))",
        fontSize: isMobile ? 10 : 12,
        tickLine: false,
        axisLine: false,
        tickFormatter: formatDate,
        minTickGap: isMobile ? 40 : 40,
        height: isMobile ? 30 : 40,
      },
      yAxis: {
        stroke: "hsl(var(--muted-foreground))",
        fontSize: isMobile ? 10 : 12,
        tickLine: false,
        axisLine: false,
        width: isMobile ? 45 : 80,
        tickFormatter: formatCurrency,
        hide: isMobile,
      },
      tooltip: {
        content: (props: TooltipProps<ValueType, NameType>) => (
          <ChartTooltip
            {...props}
            selectedRange={timeRange}
            formatValue={formatWithCurrency}
          />
        ),
      },
    }),
    [isMobile, formatDate, formatCurrency, timeRange, formatWithCurrency],
  );

  // Render the appropriate chart based on selected type
  const renderChart = () => {
    if (isLoading) return <ChartLoading />;
    if (!networthHistory || networthHistory.length === 0) return <ChartEmpty />;

    const margin = {
      top: 10,
      right: isMobile ? 10 : 30,
      left: isMobile ? 10 : 40,
      bottom: isMobile ? 20 : 10,
    };

    const gradientDef = (
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
          <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
        </linearGradient>
      </defs>
    );

    switch (chartType) {
      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={networthHistory} margin={margin}>
              {gradientDef}
              <XAxis {...commonAxisProps.xAxis} />
              <YAxis {...commonAxisProps.yAxis} />
              <Tooltip content={commonAxisProps.tooltip.content} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                fillOpacity={1}
                fill="url(#colorValue)"
                // Add dot renderer to show only real data points
                dot={(props) => {
                  if (!showFilledIndicator) return null;
                  // Only show dots for real data points
                  const isRealDataPoint = realDataPointsMap.has(
                    props.payload.date,
                  );
                  if (!isRealDataPoint) return null;

                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={chartColor}
                      stroke="white"
                      strokeWidth={1}
                    />
                  );
                }}
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

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={networthHistory} margin={margin}>
              {gradientDef}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted-foreground)/0.2)"
              />
              <XAxis {...commonAxisProps.xAxis} />
              <YAxis {...commonAxisProps.yAxis} />
              <Tooltip content={commonAxisProps.tooltip.content} />
              <ReferenceLine
                y={averageValue}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
              >
                <Label
                  value="Average"
                  position="insideRight"
                  fill="hsl(var(--muted-foreground))"
                />
              </ReferenceLine>
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                dot={(props) => {
                  if (!showFilledIndicator) return null;
                  // Only show dots for real data points
                  const isRealDataPoint = realDataPointsMap.has(
                    props.payload.date,
                  );
                  if (!isRealDataPoint) return null;

                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={chartColor}
                      stroke="white"
                      strokeWidth={1}
                    />
                  );
                }}
                activeDot={{ r: 6, fill: chartColor, stroke: "white" }}
                // Use dashed line for filled data points
                strokeDasharray={(props) => {
                  if (!showFilledIndicator) return "0";
                  // If it's a filled data point, make the line dashed
                  const isRealDataPoint = realDataPointsMap.has(
                    props.payload.date,
                  );
                  return isRealDataPoint ? "0" : "3 3";
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={networthHistory} margin={margin}>
              {gradientDef}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted-foreground)/0.2)"
                vertical={false}
              />
              <XAxis {...commonAxisProps.xAxis} />
              <YAxis {...commonAxisProps.yAxis} />
              <Tooltip content={commonAxisProps.tooltip.content} />
              <defs>
                <pattern
                  id="diagonalHatch"
                  patternUnits="userSpaceOnUse"
                  width="4"
                  height="4"
                >
                  <path
                    d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
                    stroke={chartColor}
                    strokeWidth="1"
                    opacity="0.5"
                  />
                </pattern>
              </defs>
              <Area
                type="stepAfter"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#diagonalHatch)"
                fillOpacity={0.6}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={networthHistory} margin={margin}>
              {gradientDef}
              <XAxis {...commonAxisProps.xAxis} />
              <YAxis {...commonAxisProps.yAxis} />
              <Tooltip content={commonAxisProps.tooltip.content} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  const chartTypes = [
    { value: "area", label: "Area", icon: <TrendingUp className="h-4 w-4" /> },
    {
      value: "line",
      label: "Line",
      icon: <LineChartIcon className="h-4 w-4" />,
    },
    { value: "bar", label: "Stepped", icon: <BarChart2 className="h-4 w-4" /> },
  ];

  return (
    <Card className="col-span-4">
      <CardHeader className={isMobile ? "px-4 py-3" : undefined}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <CardTitle className={isMobile ? "text-base" : undefined}>
            {isMobile ? "Net Worth" : "Net Worth Over Time"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {chartTypes.find((type) => type.value === chartType)?.icon}
                  <span className="hidden sm:inline">
                    {chartTypes.find((type) => type.value === chartType)?.label}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {chartTypes.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => setChartType(type.value as ChartType)}
                    className="flex items-center gap-2"
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <TimeRangeSelector />

            {/* Toggle for showing/hiding data point indicators */}
            {dataStats && dataStats.filled > 0 && (
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showFilledIndicator ? "outline" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setShowFilledIndicator(!showFilledIndicator)
                      }
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end" className="max-w-[300px]">
                    <p className="mb-2">
                      {showFilledIndicator ? "Showing" : "Hiding"} indicators
                      for estimated data
                    </p>
                    <div className="text-xs">
                      <p>Real data points: {dataStats.real}</p>
                      <p>Filled data points: {dataStats.filled}</p>
                      <p className="mt-2 text-muted-foreground italic">
                        Filled points use last known value until next update
                      </p>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={isMobile ? "px-2 pb-2" : undefined}>
        <div
          className={`${isMobile ? "h-[300px]" : "h-[400px]"}`}
          ref={chartContainerRef}
        >
          {renderChart()}
        </div>

        <div className="mt-2 flex flex-col space-y-1">
          {events?.length > 0 && (
            <div className="flex items-center text-xs text-muted-foreground">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      <Info className="h-3 w-3 mr-1" />
                      <span>
                        {isMobile
                          ? "Significant changes highlighted"
                          : "Significant changes in net worth are highlighted"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>
                      These points indicate significant changes in your net
                      worth that might represent notable financial events.
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          )}

          {dataStats && dataStats.filled > 0 && showFilledIndicator && (
            <div className="flex items-center text-xs text-muted-foreground">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      <Info className="h-3 w-3 mr-1" />
                      <span>
                        {isMobile
                          ? `${dataStats.filled} filled data points`
                          : `${dataStats.filled} data points are filled with estimated values`}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>
                      Filled data points represent days where no account updates
                      were made. These points use the last known balance until
                      the next update.
                    </p>
                    <p className="mt-2 text-xs">
                      Real data points:{" "}
                      <span className="font-semibold">{dataStats.real}</span>
                      <br />
                      Filled data points:{" "}
                      <span className="font-semibold">{dataStats.filled}</span>
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
