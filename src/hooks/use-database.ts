import { useDatabaseStore } from "@/store/database-store";
import type { DatabaseProvider } from "@/types";

// Simple enum for database backend type
export type BackendType = "local" | "supabase";

export function useDatabase() {
  // Get only what we need from database store
  const db = useDatabaseStore((state) => state.db);
  const backend = useDatabaseStore((state) => state.backend);
  const setUserId = useDatabaseStore((state) => state.setUserId);

  return {
    // Core database access
    db,

    // Simple status properties
    backendType: backend as BackendType,

    // Essential action
    setUserId,
  };
}
