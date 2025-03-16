import { useDatabaseStore } from "@/store/database-store";
import type { DatabaseProvider } from "@/types";
import { useAuthStore } from "@/store/auth-store";

export function useDatabase() {
  // Select only the database instance from store
  const db = useDatabaseStore((state) => state.db) as DatabaseProvider;
  const toggleTestMode = useDatabaseStore((state) => state.toggleTestMode);
  const refreshDatabase = useDatabaseStore((state) => state.refreshDatabase);
  const { databaseMode } = useAuthStore();

  return {
    db,
    toggleTestMode,
    refreshDatabase,
    databaseMode,
  };
}
