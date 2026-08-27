import { TimeRange } from "@/types/networth";

export const convertTimeRangeToDays = (timeRange: TimeRange): number =>
  timeRange;

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

export const getPeriodLabel = (days: TimeRange): string => {
  switch (days) {
    case 1:
      return "24 hours";
    case 7:
      return "week";
    case 30:
      return "month";
    case 365:
      return "year";
    case 0:
      return "all time";
    default:
      return `${days} days`;
  }
};
