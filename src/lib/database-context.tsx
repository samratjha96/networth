import React, { ReactNode, createContext } from "react";
import { useDatabase as useStoreDatabase } from "@/hooks/use-database";
import type { DatabaseProvider } from "@/types";
import type { DatabaseBackend } from "./database-factory";

// Define the DatabaseContextType here
interface DatabaseContextType {
  db: DatabaseProvider;
  isTestMode: boolean;
  toggleTestMode: () => Promise<void>;
  currentBackend: DatabaseBackend;
  refreshDatabase: () => Promise<void>;
}

/**
 * Legacy database context - kept for compatibility
 * This re-exports our new Zustand-based implementation
 */
export const DatabaseContext = createContext<DatabaseContextType | undefined>(
  undefined,
);

/**
 * Legacy DatabaseProvider - forwards to our new Zustand implementation
 * Kept for compatibility with code that expects this component
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  // All the state management is now handled via Zustand
  // This is just a passthrough component
  return <>{children}</>;
}

/**
 * Legacy useDatabase hook - re-exports our new hook
 * Kept for compatibility with code that imports from this file
 */
export function useDatabase() {
  return useStoreDatabase();
}
