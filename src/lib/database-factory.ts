import { DatabaseProvider } from "@/types";
import { db as mockDb } from "@/lib/database";
import { supabaseDb, useSupabase } from "@/lib/supabase-database";

// Database backend types
export type DatabaseBackend = "local" | "supabase";

/**
 * Get a database instance for a specific backend type
 * @param backend The backend type to get an instance for
 * @returns The database provider instance for the specified backend
 */
export function getDatabaseInstance(
  backend: DatabaseBackend,
): DatabaseProvider {
  if (backend === "supabase" && supabaseDb) {
    console.debug("Using Supabase database from getDatabaseInstance");
    return supabaseDb;
  }

  console.debug("Using local mock database from getDatabaseInstance");
  return mockDb;
}

/**
 * @deprecated Use the database store instead of this function
 * The function exists for backward compatibility only
 */
export function getDatabase(): DatabaseProvider {
  console.warn("getDatabase is deprecated, use the useDatabaseStore instead");
  // Import dynamically to avoid circular dependency
  const { useDatabaseStore } = require("@/store/database-store");
  return useDatabaseStore.getState().db;
}

/**
 * @deprecated Use the database store instead of this function
 * The function exists for backward compatibility only
 */
export function getDatabaseBackend(): DatabaseBackend {
  console.warn(
    "getDatabaseBackend is deprecated, use the useDatabaseStore instead",
  );
  // Import dynamically to avoid circular dependency
  const { useDatabaseStore } = require("@/store/database-store");
  return useDatabaseStore.getState().backend;
}

/**
 * @deprecated Use useDatabaseStore.setBackend("local") instead
 */
export function forceMockDatabaseForDevelopment(enabled: boolean): void {
  console.warn(
    "forceMockDatabaseForDevelopment is deprecated, use useDatabaseStore.setBackend instead",
  );

  // Import dynamically to avoid circular dependency
  const { useDatabaseStore } = require("@/store/database-store");

  if (enabled) {
    useDatabaseStore.getState().setBackend("local");
  } else {
    // Get current user ID
    const userId = supabaseDb?.hasUserId() ? "has-user" : null;
    const backend = userId && useSupabase ? "supabase" : "local";
    useDatabaseStore.getState().setBackend(backend);
  }
}
