import { useMemo } from "react";
import { useDatabaseStore } from "@/store/database-store";
import type { DatabaseProvider } from "@/types";

export function useDatabase() {
  const state = useDatabaseStore();

  return useMemo(
    () => ({
      // Database instance
      db: state.db as DatabaseProvider,

      // State
      currentBackend: state.currentBackend,
      isTestMode: state.isTestMode,

      // Actions
      toggleTestMode: state.toggleTestMode,
      refreshDatabase: state.refreshDatabase,

      // Backend helpers
      isLocal: state.currentBackend === "local",
      isSupabase: state.currentBackend === "supabase",

      // Backend switchers
      switchToSupabase: state.switchToSupabase,
      switchToLocal: state.switchToLocal,
    }),
    [
      state.db,
      state.currentBackend,
      state.isTestMode,
      state.toggleTestMode,
      state.refreshDatabase,
      state.switchToSupabase,
      state.switchToLocal,
    ],
  );
}
