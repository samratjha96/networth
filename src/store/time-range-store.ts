import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TimeRange } from "@/types/networth";

interface TimeRangeState {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

export const useTimeRangeStore = create<TimeRangeState>()(
  persist(
    (set) => ({
      timeRange: 365, // Default to 365 days (1 year)
      setTimeRange: (range: TimeRange) => set({ timeRange: range }),
    }),
    {
      name: "time-range-preference", // Local storage key
    },
  ),
);
