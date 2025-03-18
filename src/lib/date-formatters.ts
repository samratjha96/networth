import { TimeRange } from "@/types/networth";

/**
 * Format a date string based on the selected time range
 */
export function formatDateByRange(
  dateStr: string,
  selectedRange: TimeRange,
): string {
  const date = new Date(dateStr);

  // Convert string range to number for comparison
  const rangeValue =
    typeof selectedRange === "number"
      ? selectedRange
      : selectedRange === "day"
        ? 1
        : selectedRange === "week"
          ? 7
          : selectedRange === "month"
            ? 30
            : selectedRange === "year"
              ? 365
              : selectedRange === "all"
                ? 0
                : 30; // Default to month

  if (rangeValue >= 365 || rangeValue === 0) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
  }

  if (rangeValue >= 7) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a date for tooltip with appropriate detail level based on time range
 */
export function formatTooltipDate(
  date: Date,
  selectedRange: TimeRange,
): string {
  // Convert string range to number for comparison
  const rangeValue =
    typeof selectedRange === "number"
      ? selectedRange
      : selectedRange === "day"
        ? 1
        : 30; // For tooltip, only need to know if it's a day view

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: rangeValue === 1 ? "numeric" : undefined,
    minute: rangeValue === 1 ? "numeric" : undefined,
  });
}
