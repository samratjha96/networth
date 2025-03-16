import React from "react";
import { formatTooltipDate } from "@/lib/date-formatters";
import { TimeRange } from "@/types";
import { TooltipProps } from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

// Extend the recharts TooltipProps with our custom props
interface ChartTooltipProps extends TooltipProps<ValueType, NameType> {
  selectedRange: TimeRange;
  formatValue: (value: number) => string;
}

export function ChartTooltip({
  active,
  payload,
  selectedRange,
  formatValue,
}: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const value = payload[0].value as number;
  const date = new Date(payload[0].payload.date);
  const formattedDate = formatTooltipDate(date, selectedRange);

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
          <span className={`font-bold ${value < 0 ? "text-destructive" : ""}`}>
            {formatValue(value)}
          </span>
        </div>
      </div>
    </div>
  );
}
