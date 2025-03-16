import { NetWorthDataPoint } from "@/types";

/**
 * Maximum number of data points to display in a chart for optimal performance
 */
const MAX_CHART_POINTS = 150;

/**
 * Determines the optimal data resolution based on viewport width and time range
 */
export function getOptimalResolution(
  viewportWidth: number,
  timeRangeDays: number
): number {
  // Base number of points based on viewport width
  const basePoints = Math.max(50, Math.min(viewportWidth / 5, MAX_CHART_POINTS));
  
  // Adjust resolution based on time range
  if (timeRangeDays <= 1) {
    // For 1 day, show more granular data (hourly)
    return 1;
  } else if (timeRangeDays <= 7) {
    // For 1 week, we show points every few hours
    return Math.max(1, Math.floor((timeRangeDays * 24) / basePoints));
  } else if (timeRangeDays <= 30) {
    // For 1 month, adjust to show reasonable number of points
    return Math.max(4, Math.floor((timeRangeDays * 24) / basePoints));
  } else if (timeRangeDays <= 365) {
    // For 1 year, consider daily data points
    return Math.max(24, Math.floor((timeRangeDays * 24) / basePoints));
  } else {
    // For all time (> 1 year), consider weekly or monthly data points
    return Math.max(24 * 7, Math.floor((timeRangeDays * 24) / basePoints));
  }
}

/**
 * Samples data points to the desired resolution.
 * Resolution is in hours (e.g., 1 = hourly, 24 = daily)
 */
export function sampleDataPoints(
  data: NetWorthDataPoint[],
  resolution: number, 
  maxPoints: number = MAX_CHART_POINTS
): NetWorthDataPoint[] {
  if (!data.length) return [];
  
  // If data is already smaller than max points, return as is
  if (data.length <= maxPoints) return data;
  
  const result: NetWorthDataPoint[] = [];
  
  // For small datasets, use simple downsampling
  if (data.length <= maxPoints * 3) {
    const step = Math.ceil(data.length / maxPoints);
    for (let i = 0; i < data.length; i += step) {
      result.push(data[i]);
    }
    // Always include the last point for accurate current value
    if (result[result.length - 1] !== data[data.length - 1]) {
      result.push(data[data.length - 1]);
    }
    return result;
  }
  
  // For larger datasets, use more sophisticated sampling with aggregation
  
  // Sort data by timestamp if not already sorted
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Calculate interval size based on time range
  const startTime = new Date(sortedData[0].date).getTime();
  const endTime = new Date(sortedData[sortedData.length - 1].date).getTime();
  const timeRange = endTime - startTime;
  
  const intervalSize = timeRange / maxPoints;
  
  let currentInterval = startTime;
  let currentBucket: NetWorthDataPoint[] = [];
  
  // Always include the first point
  result.push(sortedData[0]);
  
  // Process intermediate points
  for (let i = 1; i < sortedData.length - 1; i++) {
    const pointTime = new Date(sortedData[i].date).getTime();
    
    if (pointTime <= currentInterval + intervalSize) {
      // Add to current bucket
      currentBucket.push(sortedData[i]);
    } else {
      // Process bucket and start a new one
      if (currentBucket.length > 0) {
        // Take either average, min, max or most significant change
        const significantPoint = getMostSignificantPoint(currentBucket);
        result.push(significantPoint);
        currentBucket = [];
      }
      
      // Move to next interval
      while (pointTime > currentInterval + intervalSize) {
        currentInterval += intervalSize;
      }
      
      currentBucket.push(sortedData[i]);
    }
  }
  
  // Process the last bucket if needed
  if (currentBucket.length > 0) {
    result.push(getMostSignificantPoint(currentBucket));
  }
  
  // Always include the last point
  if (result[result.length - 1] !== sortedData[sortedData.length - 1]) {
    result.push(sortedData[sortedData.length - 1]);
  }
  
  return result;
}

/**
 * Get the most significant point from a bucket of points.
 * This could be the point with the largest change, or we could use other strategies.
 */
function getMostSignificantPoint(points: NetWorthDataPoint[]): NetWorthDataPoint {
  if (points.length === 1) return points[0];
  
  // Default strategy: return the point with the largest value change from previous point
  let maxChangePoint = points[0];
  let maxChange = 0;
  
  for (let i = 1; i < points.length; i++) {
    const change = Math.abs(points[i].value - points[i-1].value);
    if (change > maxChange) {
      maxChange = change;
      maxChangePoint = points[i];
    }
  }
  
  return maxChangePoint;
}

/**
 * Calculate significant events in a dataset by identifying points with notable changes
 */
export function getSignificantEvents(
  data: NetWorthDataPoint[],
  thresholdPercentage: number = 2.0
): NetWorthDataPoint[] {
  if (data.length < 2) return [];
  
  const events: NetWorthDataPoint[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const prevValue = data[i-1].value;
    const currentValue = data[i].value;
    
    // Skip when prevValue is zero to avoid division by zero
    if (prevValue === 0) continue;
    
    const percentChange = Math.abs((currentValue - prevValue) / prevValue) * 100;
    
    if (percentChange >= thresholdPercentage) {
      events.push(data[i]);
    }
  }
  
  return events;
} 