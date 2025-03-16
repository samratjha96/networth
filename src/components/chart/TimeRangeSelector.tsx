import React from "react";
import { Button } from "../ui/button";
import { TimeRange } from "@/types/networth";

const TIME_RANGES = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "1Y", days: 365 },
  { label: "ALL", days: 0 },
] as const;

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (days: TimeRange) => void;
}

export function TimeRangeSelector({
  selectedRange,
  onRangeChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1 sm:gap-2">
      {TIME_RANGES.map((range) => (
        <Button
          key={range.label}
          variant={selectedRange === range.days ? "default" : "outline"}
          size="sm"
          className="px-2 sm:px-4"
          onClick={() => onRangeChange(range.days as TimeRange)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
