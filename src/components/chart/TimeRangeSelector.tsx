import React from "react";
import { Button } from "../ui/button";
import { TimeRange } from "@/types/networth";
import { useTimeRangeStore } from "@/store/time-range-store";

const TIME_RANGES = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "1Y", days: 365 },
  { label: "ALL", days: 0 },
] as const;

export function TimeRangeSelector() {
  const timeRange = useTimeRangeStore((state) => state.timeRange);
  const setTimeRange = useTimeRangeStore((state) => state.setTimeRange);

  return (
    <div className="flex gap-1 sm:gap-2">
      {TIME_RANGES.map((range) => (
        <Button
          key={range.label}
          variant={timeRange === range.days ? "default" : "outline"}
          size="sm"
          className="px-2 sm:px-4"
          onClick={() => setTimeRange(range.days as TimeRange)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
