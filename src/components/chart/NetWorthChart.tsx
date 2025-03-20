import React, { useRef, useState } from "react";
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
} from "recharts";
import { CurrencyCode } from "@/types/currency";
import {
  Info,
  BarChart2,
  LineChart as LineChartIcon,
  TrendingUp,
} from "lucide-react";
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

type ChartType = "area" | "line" | "bar";

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
  const [chartType, setChartType] = useState<ChartType>("area");
  const timeRange = useTimeRangeStore((state) => state.timeRange);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const { formatWithCurrency } = useCurrencyFormatter(currency);
  const { networthHistory } = getMockDataInstance();

  // Filter data based on time range
  const filteredData = (() => {
    const timeRangeNumber =
      typeof timeRange === "number"
        ? timeRange
        : timeRange === "day"
          ? 1
          : timeRange === "week"
            ? 7
            : timeRange === "month"
              ? 30
              : timeRange === "year"
                ? 365
                : 0;

    if (timeRangeNumber === 0) {
      return networthHistory;
    }

    const cutoffIndex = Math.max(0, networthHistory.length - timeRangeNumber);
    return networthHistory.slice(cutoffIndex);
  })();

  // Generate some event points (significant changes)
  const events =
    filteredData.length > 5
      ? [
          filteredData[Math.floor(filteredData.length * 0.33)],
          filteredData[Math.floor(filteredData.length * 0.66)],
        ]
      : [];

  // Calculate average and trend line data
  const averageValue = React.useMemo(() => {
    if (!filteredData.length) return 0;
    const sum = filteredData.reduce((acc, item) => acc + item.value, 0);
    return sum / filteredData.length;
  }, [filteredData]);

  // Chart color based on net worth
  const chartColor =
    currentNetWorth < 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))";

  // Format date for display
  const formatDate = (dateStr: string) => formatDateByRange(dateStr, timeRange);

  // Render the appropriate chart based on selected type
  const renderChart = () => {
    if (isLoading) return <ChartLoading />;
    if (!filteredData || filteredData.length === 0) return <ChartEmpty />;

    const isMobile = window.innerWidth < 768;
    const margin = {
      top: 10,
      right: isMobile ? 10 : 30,
      left: isMobile ? 20 : 40,
      bottom: 10,
    };

    const commonAxisProps = {
      xAxis: {
        dataKey: "date",
        stroke: "hsl(var(--muted-foreground))",
        fontSize: isMobile ? 10 : 12,
        tickLine: false,
        axisLine: false,
        tickFormatter: formatDate,
        minTickGap: isMobile ? 20 : 40,
      },
      yAxis: {
        stroke: "hsl(var(--muted-foreground))",
        fontSize: isMobile ? 10 : 12,
        tickLine: false,
        axisLine: false,
        width: isMobile ? 60 : 80,
        tickFormatter: (value: number) => formatWithCurrency(value),
      },
      tooltip: {
        content: (props: any) => (
          <ChartTooltip
            {...props}
            selectedRange={timeRange}
            formatValue={formatWithCurrency}
          />
        ),
      },
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
            <AreaChart data={filteredData} margin={margin}>
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
            <LineChart data={filteredData} margin={margin}>
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
                dot={false}
                activeDot={{ r: 6, fill: chartColor, stroke: "white" }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={margin}>
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
            <AreaChart data={filteredData} margin={margin}>
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
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Net Worth Over Time</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-md overflow-hidden">
              {chartTypes.map((type) => (
                <button
                  key={type.value}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    chartType === type.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setChartType(type.value as ChartType)}
                >
                  {type.icon}
                  <span className="hidden sm:inline">{type.label}</span>
                </button>
              ))}
            </div>
            <TimeRangeSelector />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]" ref={chartContainerRef}>
          {renderChart()}
        </div>

        {events?.length > 0 && (
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-help">
                    <Info className="h-3 w-3 mr-1" />
                    <span>
                      Significant changes in net worth are highlighted
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>
                    These points indicate significant changes in your net worth
                    that might represent notable financial events.
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
