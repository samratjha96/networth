import { useState, useEffect } from "react";
import { TimeRange } from "@/types/networth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useDataSource } from "@/contexts/DataSourceContext";

// Interface for net worth data returned by the hook
export interface NetWorthData {
  currentValue: number;
  previousValue: number;
  change: number;
  percentageChange: number;
}

// Simulate historical net worth data storage (only needed for localStorage implementation)
interface NetWorthHistoryData {
  [timeKey: string]: number;
}

// Get a key for storing historical data based on time range
const getTimeKey = (timeRange: TimeRange) => {
  return `history_${timeRange}`;
};

export function useNetWorthHistory(
  currentNetWorth: number,
  timeRange: TimeRange,
) {
  const { dataSource, userId } = useDataSource();

  // Default data state (for loading or error)
  const defaultData: NetWorthData = {
    currentValue: currentNetWorth,
    previousValue: currentNetWorth * 0.95,
    change: currentNetWorth * 0.05,
    percentageChange: 5,
  };

  // Local storage implementation
  const fetchLocalNetWorthHistory = () => {
    // Try to load historical data from localStorage
    const storedData = localStorage.getItem("networth_historical_data");
    let netWorthHistory: NetWorthHistoryData = storedData
      ? JSON.parse(storedData)
      : {};

    // Initialize any missing time ranges with historical data
    let dataChanged = false;

    // For each time range, initialize historical data if not present
    [1, 7, 30, 365, 0].forEach((period) => {
      const timeKey = getTimeKey(period as TimeRange);
      if (!netWorthHistory[timeKey]) {
        const randomFactor = 0.92 + Math.random() * 0.05;
        netWorthHistory[timeKey] = currentNetWorth * randomFactor;
        dataChanged = true;
      }
    });

    // Save updated historical data
    if (dataChanged) {
      localStorage.setItem(
        "networth_historical_data",
        JSON.stringify(netWorthHistory),
      );
    }

    // Get the historical value for this time range
    const timeKey = getTimeKey(timeRange);
    const previousValue = netWorthHistory[timeKey] || currentNetWorth * 0.95;

    // Calculate change and percentage
    const change = currentNetWorth - previousValue;
    const percentageChange =
      previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : 0;

    return {
      currentValue: currentNetWorth,
      previousValue,
      change,
      percentageChange,
    };
  };

  // Supabase implementation
  const fetchSupabaseNetWorthHistory = async () => {
    if (!userId) return defaultData;

    try {
      // Calculate start date based on timeRange
      const startDate = new Date();
      if (typeof timeRange === "number" && timeRange > 0) {
        startDate.setDate(startDate.getDate() - timeRange);
      } else {
        // For "all time", use a very old date
        startDate.setFullYear(startDate.getFullYear() - 10);
      }

      // Get the latest historical value and the value at start date
      const { data: historyData, error: historyError } = await supabase
        .from("networth_history")
        .select("value, date")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(1);

      if (historyError) {
        console.error("Supabase query error:", historyError);
        throw historyError;
      }

      // Get historical value at start date
      const { data: startData, error: startError } = await supabase
        .from("networth_history")
        .select("value")
        .eq("user_id", userId)
        .lt("date", startDate.toISOString())
        .order("date", { ascending: false })
        .limit(1);

      if (startError) {
        console.error("Supabase query error:", startError);
        throw startError;
      }

      const currentValue = historyData?.[0]?.value || currentNetWorth;
      const previousValue = startData?.[0]?.value || currentValue * 0.95;
      const change = currentValue - previousValue;
      const percentageChange =
        previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : 0;

      return {
        currentValue,
        previousValue,
        change,
        percentageChange,
      };
    } catch (error) {
      console.error("Error fetching net worth history:", error);
      return defaultData;
    }
  };

  // Using React Query for remote data
  const {
    data: remoteData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["networth-history", userId, timeRange, currentNetWorth],
    queryFn: fetchSupabaseNetWorthHistory,
    enabled: dataSource === "remote" && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Return data based on the current data source
  if (dataSource === "local") {
    return fetchLocalNetWorthHistory();
  }

  // Handle remote data source
  if (isLoading) {
    console.log("Loading remote data...");
    return defaultData;
  }

  if (error) {
    console.error("Error in useNetWorthHistory:", error);
    return defaultData;
  }

  return remoteData || defaultData;
}
