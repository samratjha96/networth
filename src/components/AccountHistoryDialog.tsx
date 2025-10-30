import React, { useRef, useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
import {
  BarChart2,
  LineChart as LineChartIcon,
  TrendingUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTimeRangeStore } from "@/store/time-range-store";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { formatDateByRange } from "@/lib/date-formatters";
import { ChartTooltip } from "./chart/ChartTooltip";
import { TimeRangeSelector } from "./chart/TimeRangeSelector";
import { useIsMobile } from "@/hooks/ui";
import { usePocketBaseAccountHistory } from "@/api/pocketbase-queries";
import { useAppData } from "@/hooks/app-context";
import { AccountWithValue } from "@/types/accounts";
import { accountTypeEmojis } from "@/lib/utils";
import { getPeriodLabel } from "@/utils/time-range";

type ChartType = "area" | "line" | "bar";

interface AccountHistoryDialogProps {
  account: AccountWithValue | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AccountHistoryDialog({
  account,
  isOpen,
  onClose,
}: AccountHistoryDialogProps) {
  const [chartType, setChartType] = useState<ChartType>("area");
  const timeRange = useTimeRangeStore((state) => state.timeRange);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const { formatWithCurrency } = useCurrencyFormatter(
    account?.currency || "USD",
  );
  const isMobile = useIsMobile();

  // Get required dependencies
  const { userId } = useAppData();

  // Use account history hook
  const { data: accountHistory = [], isLoading } = usePocketBaseAccountHistory(
    userId,
    account?.id || null,
    timeRange,
  );

  // Calculate average value for trend line
  const averageValue = useMemo(() => {
    if (!accountHistory.length) return 0;
    const sum = accountHistory.reduce((acc, item) => acc + item.value, 0);
    return sum / accountHistory.length;
  }, [accountHistory]);

  // Calculate gain/loss over the selected time range
  const gainLossData = useMemo(() => {
    if (!accountHistory || accountHistory.length < 2) {
      return { gain: 0, loss: 0, percentage: 0, isPositive: true, change: 0 };
    }

    const sortedHistory = [...accountHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const startValue = sortedHistory[0].value;
    const endValue = sortedHistory[sortedHistory.length - 1].value;
    const change = endValue - startValue;
    const percentage = startValue !== 0 ? (change / Math.abs(startValue)) * 100 : 0;
    
    return {
      gain: change > 0 ? change : 0,
      loss: change < 0 ? Math.abs(change) : 0,
      percentage: Math.abs(percentage),
      isPositive: change >= 0,
      change
    };
  }, [accountHistory, timeRange]);

  // Chart color based on account type and debt status
  const chartColor = useMemo(
    () =>
      account?.isDebt
        ? "hsl(var(--destructive))"
        : "hsl(var(--primary))",
    [account?.isDebt],
  );

  // Format date for display
  const formatDate = useCallback(
    (dateStr: string) => formatDateByRange(dateStr, timeRange),
    [timeRange],
  );

  // Format currency for mobile
  const formatCurrency = useCallback(
    (value: number) => {
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
    },
    [isMobile, formatWithCurrency],
  );

  // Memoize axis props
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

  // Render loading state
  const renderLoading = () => (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Skeleton
        className={`${isMobile ? "h-[350px]" : "h-[450px]"} w-full rounded-lg`}
      />
    </div>
  );

  // Render empty state
  const renderEmpty = () => (
    <div
      className={`flex flex-col items-center justify-center ${isMobile ? "h-[350px]" : "h-[450px]"} text-center p-8`}
    >
      <TrendingUp
        className={`${isMobile ? "h-16 w-16" : "h-20 w-20"} text-muted-foreground mb-6`}
      />
      <h3 className={`font-semibold ${isMobile ? "text-lg" : "text-xl"} mb-3`}>
        No History Available
      </h3>
      <p className="text-muted-foreground max-w-md leading-relaxed">
        No historical data found for this account in the selected time range.
        {isMobile
          ? ""
          : " Try selecting a different time period or check back after account updates."}
      </p>
    </div>
  );

  // Render the appropriate chart
  const renderChart = () => {
    if (isLoading) return renderLoading();
    if (!accountHistory || accountHistory.length === 0) return renderEmpty();

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
            <AreaChart data={accountHistory} margin={margin}>
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
                dot={{
                  r: 4,
                  fill: chartColor,
                  stroke: "white",
                  strokeWidth: 1,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accountHistory} margin={margin}>
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
                dot={{
                  r: 4,
                  fill: chartColor,
                  stroke: "white",
                  strokeWidth: 1,
                }}
                activeDot={{ r: 6, fill: chartColor, stroke: "white" }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={accountHistory} margin={margin}>
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
        return renderEmpty();
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

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-4 pb-2">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-3 text-xl">
            <div className="flex items-center gap-3">
              <span className={`${isMobile ? "text-xl" : "text-2xl"}`}>
                {accountTypeEmojis[account.type] || "💰"}
              </span>
              <span className="font-semibold">{account.name} History</span>
            </div>
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-3">
            {/* Account Balance with Percentage Change */}
            <div className="flex flex-col gap-2">
              <div className={`${isMobile ? "text-xl" : "text-2xl"} font-bold`}>
                {formatWithCurrency(account.balance)}
              </div>
              {accountHistory.length >= 2 && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <span
                    className={`flex items-center ${
                      gainLossData.isPositive ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {gainLossData.isPositive ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {gainLossData.isPositive ? "+" : ""}
                    {formatWithCurrency(Math.abs(gainLossData.change))}
                  </span>
                  <span className="ml-1">
                    ({gainLossData.isPositive ? "+" : ""}
                    {gainLossData.percentage.toFixed(2)}%) over the last{" "}
                    {getPeriodLabel(timeRange)}
                  </span>
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <CardTitle className="text-lg">
                Account Balance Over Time
              </CardTitle>
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 min-w-[100px]"
                    >
                      {
                        chartTypes.find((type) => type.value === chartType)
                          ?.icon
                      }
                      <span className="hidden sm:inline">
                        {
                          chartTypes.find((type) => type.value === chartType)
                            ?.label
                        }
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
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className={`${isMobile ? "h-[350px]" : "h-[450px]"} w-full`}
              ref={chartContainerRef}
            >
              {renderChart()}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center sm:justify-end pt-6 pb-2">
          <Button
            variant="outline"
            onClick={onClose}
            className={`${isMobile ? "w-full max-w-[200px]" : "min-w-[100px]"}`}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
