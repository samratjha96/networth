import React from "react";

export function ChartLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
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
