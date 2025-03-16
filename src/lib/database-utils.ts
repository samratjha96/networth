import { useState, useCallback } from "react";
import { useDatabase } from "./database-context";

// Centralized error handling for database operations
export function useAsyncOperation<T, P extends any[]>(
  operation: (
    db: ReturnType<typeof useDatabase>["db"],
    ...args: P
  ) => Promise<T>,
  defaultValue: T,
) {
  const { db } = useDatabase();
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: P) => {
      try {
        setIsLoading(true);
        const result = await operation(db, ...args);
        setData(result);
        setError(null);
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Operation failed");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [db, operation],
  );

  return { data, isLoading, error, execute };
}

// Utility for standardized error messages
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
