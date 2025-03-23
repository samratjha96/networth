import React from "react";
import { Button } from "../ui/button";
import { TimeRange } from "@/types/networth";
import { useTimeRangeStore } from "@/store/time-range-store";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

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
  const isMobile = useIsMobile();

  if (isMobile) {
    const currentRange = TIME_RANGES.find((range) => range.days === timeRange);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <span>{currentRange?.label || "1Y"}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {TIME_RANGES.map((range) => (
            <DropdownMenuItem
              key={range.label}
              onClick={() => setTimeRange(range.days as TimeRange)}
              className="flex items-center gap-2"
            >
              {range.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

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
