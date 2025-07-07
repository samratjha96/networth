import { NetworthHistory, TimeRange } from "@/types/networth";
import { getStartDateForTimeRange, convertTimeRangeToDays } from "./time-range";

/**
 * Determines the appropriate time interval to use based on the selected time range
 */
export enum TimeInterval {
  HOURLY = "hourly",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

/**
 * Gets the appropriate sampling interval based on the time range
 */
export function getIntervalForTimeRange(timeRange: TimeRange): TimeInterval {
  const days = convertTimeRangeToDays(timeRange);

  if (days <= 1) {
    return TimeInterval.HOURLY;
  } else if (days <= 30) {
    return TimeInterval.DAILY;
  } else if (days <= 90) {
    return TimeInterval.WEEKLY;
  } else {
    return TimeInterval.MONTHLY;
  }
}

/**
 * Checks if two dates belong to the same interval
 */
export function isSameInterval(
  date1: Date,
  date2: Date,
  interval: TimeInterval,
): boolean {
  switch (interval) {
    case TimeInterval.HOURLY:
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate() &&
        date1.getHours() === date2.getHours()
      );
    case TimeInterval.DAILY:
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    case TimeInterval.WEEKLY:
      // Get week number
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      d1.setHours(0, 0, 0, 0);
      d2.setHours(0, 0, 0, 0);
      const weekStart1 = d1.getDate() - d1.getDay();
      const weekStart2 = d2.getDate() - d2.getDay();
      d1.setDate(weekStart1);
      d2.setDate(weekStart2);
      return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    case TimeInterval.MONTHLY:
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth()
      );
    default:
      return false;
  }
}

/**
 * Generates timestamps for the specified time range with the appropriate interval
 */
export function generateTimestamps(
  startDate: Date,
  endDate: Date,
  interval: TimeInterval,
): Date[] {
  const timestamps: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    timestamps.push(new Date(current));

    switch (interval) {
      case TimeInterval.HOURLY:
        current.setHours(current.getHours() + 1);
        break;
      case TimeInterval.DAILY:
        current.setDate(current.getDate() + 1);
        break;
      case TimeInterval.WEEKLY:
        current.setDate(current.getDate() + 7);
        break;
      case TimeInterval.MONTHLY:
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return timestamps;
}

/**
 * Fills in missing data points in networth history using the last known value
 */
export function fillMissingDataPoints(
  rawData: NetworthHistory[],
  timeRange: TimeRange,
): NetworthHistory[] {
  // If no data, return empty array
  if (rawData.length === 0) return [];

  // Sort by date ascending to ensure proper sequence
  const sortedData = [...rawData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Calculate appropriate interval based on time range
  const interval = getIntervalForTimeRange(timeRange);

  // Generate expected timestamps for the full range
  const startDate = getStartDateForTimeRange(timeRange);
  const endDate = new Date();
  const expectedTimestamps = generateTimestamps(startDate, endDate, interval);

  // Create filled data array using last known value for missing points
  const filledData: NetworthHistory[] = [];
  let lastKnownValue = sortedData[0].value;
  let dataIndex = 0;

  expectedTimestamps.forEach((timestamp) => {
    // Look for a real data point that matches this timestamp's interval
    let foundMatch = false;

    while (
      dataIndex < sortedData.length &&
      new Date(sortedData[dataIndex].date) <= timestamp
    ) {
      const dataDate = new Date(sortedData[dataIndex].date);

      if (isSameInterval(timestamp, dataDate, interval)) {
        lastKnownValue = sortedData[dataIndex].value;
        foundMatch = true;
      }

      dataIndex++;
    }

    // If we didn't find a match, use the last known value
    filledData.push({
      date: timestamp.toISOString(),
      value: lastKnownValue,
      // Add metadata that can be used to visually differentiate
      ...(foundMatch ? { isRealDataPoint: true } : { isFilledDataPoint: true }),
    } as NetworthHistory);
  });

  return filledData;
}

/**
 * Enriches the networth history with additional metadata
 */
export function enrichNetWorthData(data: NetworthHistory[]): NetworthHistory[] {
  if (data.length === 0) return data;

  return data.map((point, index, array) => {
    if (index === 0) {
      return point;
    }

    const prevPoint = array[index - 1];
    const changeAmount = point.value - prevPoint.value;
    const percentageChange =
      prevPoint.value !== 0
        ? (changeAmount / Math.abs(prevPoint.value)) * 100
        : 0;

    // Mark significant changes (more than 5%)
    const isSignificant = Math.abs(percentageChange) > 5;

    return {
      ...point,
      metadata: {
        ...point.metadata,
        changeAmount,
        percentageChange,
        isSignificant,
      },
    };
  });
}
