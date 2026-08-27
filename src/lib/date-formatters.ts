import { TimeRange } from "@/types/networth";
import { convertTimeRangeToDays } from "@/utils/time-range";

/**
 * Format a date string based on the selected time range
 */
export function formatDateByRange(
  dateStr: string,
  selectedRange: TimeRange,
): string {
  const date = new Date(dateStr);
  const rangeValue = convertTimeRangeToDays(selectedRange);

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
  const rangeValue = convertTimeRangeToDays(selectedRange);

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: rangeValue === 1 ? "numeric" : undefined,
    minute: rangeValue === 1 ? "numeric" : undefined,
  });
}
