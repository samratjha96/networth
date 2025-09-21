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
 * Fills in missing data points in networth history using historical values
 *
 * This implementation handles the case where we have sparse updates (e.g., a user
 * only updates their accounts occasionally). For each date in the selected time range,
 * it finds the most recent actual data point before that date and uses its value.
 *
 * For example, if a user updated their accounts on Jan 1 ($1000) and Jan 15 ($1200),
 * all dates from Jan 2-14 will show $1000 (the last value before those dates).
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

  // If we don't have any data in the range, return the raw data
  if (expectedTimestamps.length === 0) return rawData;

  // Create filled data array
  const filledData: NetworthHistory[] = [];

  // Process each expected timestamp
  expectedTimestamps.forEach((timestamp) => {
    // Find the last known data point BEFORE this timestamp
    let mostRecentDataPoint: NetworthHistory | null = null;
    let foundExactMatch = false;

    // First check for an exact match in this interval
    for (const dataPoint of sortedData) {
      const dataDate = new Date(dataPoint.date);

      // Skip anchor points when looking for exact matches within the time range
      // (anchor points are outside the time range and shouldn't appear on the chart)
      if ((dataPoint as any).isAnchorPoint && dataDate < startDate) {
        continue;
      }

      // Exact match for this interval?
      if (isSameInterval(timestamp, dataDate, interval)) {
        filledData.push({
          ...dataPoint,
          isRealDataPoint: true,
        } as NetworthHistory);
        foundExactMatch = true;
        break;
      }
    }

    // If we didn't find an exact match, find the most recent point before this timestamp
    if (!foundExactMatch) {
      for (const dataPoint of sortedData) {
        const dataDate = new Date(dataPoint.date);

        // This point is before our timestamp?
        if (dataDate < timestamp) {
          // Either this is our first find, or it's more recent than our previous find
          if (
            !mostRecentDataPoint ||
            dataDate > new Date(mostRecentDataPoint.date)
          ) {
            mostRecentDataPoint = dataPoint;
          }
        }
      }

      // If we found a previous data point, use its value
      if (mostRecentDataPoint) {
        filledData.push({
          date: timestamp.toISOString(),
          value: mostRecentDataPoint.value,
          isFilledDataPoint: true,
        } as NetworthHistory);
      }
    }
  });

  // Sort the result by date to ensure proper sequence
  const result = filledData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Filter out any anchor points from the final result
  // (they were used for interpolation but shouldn't appear on the chart)
  return result.filter((point) => {
    const pointDate = new Date(point.date);
    return pointDate >= startDate && pointDate <= endDate;
  });
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
