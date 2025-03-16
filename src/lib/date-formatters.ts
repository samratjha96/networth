import { TimeRange } from "@/types";

/**
 * Format a date string based on the selected time range
 */
export function formatDateByRange(
  dateStr: string,
  selectedRange: TimeRange,
): string {
  const date = new Date(dateStr);

  if (selectedRange >= 365 || selectedRange === 0) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
  }

  if (selectedRange >= 7) {
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
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: selectedRange === 1 ? "numeric" : undefined,
    minute: selectedRange === 1 ? "numeric" : undefined,
  });
}
