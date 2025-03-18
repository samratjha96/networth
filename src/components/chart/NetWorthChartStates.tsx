import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartLoading() {
  return (
    <div className="flex h-full flex-col w-full gap-4 relative">
      {/* Main chart area skeleton */}
      <div className="flex-1 w-full p-4">
        <Skeleton className="h-full w-full rounded-md opacity-70" />
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between w-full h-4 px-8 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`x-${i}`} className="h-3 w-14 rounded-md" />
        ))}
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-4 top-10 h-[calc(100%-6rem)] flex flex-col justify-between">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`y-${i}`} className="h-3 w-16 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function ChartError({ message }: { message?: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-destructive">{message || "Error loading data"}</div>
    </div>
  );
}

export function ChartEmpty() {
  return (
    <div className="flex h-full items-center justify-center flex-col gap-2">
      <div className="text-muted-foreground">
        No data available for the selected time range
      </div>
      <p className="text-sm text-muted-foreground">
        Add or update accounts to start tracking your net worth
      </p>
    </div>
  );
}
