import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle } from "lucide-react";

// Generate mock data for the past year with daily entries
const generateMockData = () => {
  const data = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from today and generate backwards
  let currentValue = 100000; // Starting net worth

  for (let i = 0; i < 366; i++) {
    // 366 days to ensure full year coverage
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Add some random variation with a stronger upward trend (when going backwards)
    const trendFactor = 0.6; // 60% chance of decrease when going backwards = upward trend when viewed normally
    const randomChange =
      (Math.random() > trendFactor ? 1 : -1) * (Math.random() * 500 + 100);
    currentValue = Math.max(50000, Math.round(currentValue - randomChange)); // Ensure minimum value of 50k

    data.unshift({
      // Add to start of array to maintain chronological order
      date: date.toISOString().split("T")[0], // YYYY-MM-DD format
      value: currentValue,
    });
  }

  return data;
};

const MOCK_DATA = generateMockData();

interface NetWorthChartProps {
  data?: Array<{
    date: string;
    value: number;
  }>;
  hasAccounts?: boolean;
}

const TIME_RANGES = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "1Y", days: 365 },
  { label: "ALL", days: 0 },
] as const;

export function NetWorthChart({
  data = MOCK_DATA,
  hasAccounts = false,
}: NetWorthChartProps) {
  const [selectedRange, setSelectedRange] = React.useState<number>(30); // Default to 1M

  const filteredData = React.useMemo(() => {
    if (selectedRange === 0) return data; // ALL

    // Get data from last n days (add 1 to include today)
    return data.slice(-(selectedRange + 1));
  }, [data, selectedRange]);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Net Worth Over Time</CardTitle>
          {hasAccounts && (
            <div className="flex gap-2">
              {TIME_RANGES.map((range) => (
                <Button
                  key={range.label}
                  variant={selectedRange === range.days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRange(range.days)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        {!hasAccounts && (
          <Alert variant="default" className="mt-4 bg-muted/50">
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
            <AlertDescription>
              Add your first account to start tracking your net worth over time
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      {hasAccounts ? (
        <CardContent className="pl-2">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${formatCurrency(value)}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Date
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {payload[0].payload.date}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Value
                              </span>
                              <span className="font-bold">
                                {formatCurrency(payload[0].value as number)}
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
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
