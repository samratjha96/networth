import { TimeRange } from "@/types/networth";

export const convertTimeRangeToDays = (timeRange: TimeRange): number => {
  if (typeof timeRange === "number") {
    return timeRange;
  }

  switch (timeRange) {
    case "day":
      return 1;
    case "week":
      return 7;
    case "month":
      return 30;
    case "year":
      return 365;
    default:
      return 0; // "all time"
  }
};

export const getStartDateForTimeRange = (timeRange: TimeRange): Date => {
  const startDate = new Date();
  const days = convertTimeRangeToDays(timeRange);

  if (days > 0) {
    startDate.setDate(startDate.getDate() - days);
  } else {
    // For "all time", use a very old date
    startDate.setFullYear(startDate.getFullYear() - 10);
  }
  return startDate;
};
