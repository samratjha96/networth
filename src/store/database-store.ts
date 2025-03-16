import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  DatabaseBackend,
  getDatabaseBackend,
  setDatabaseBackend,
  setGlobalTestMode,
  isGlobalTestMode,
} from "@/lib/database-factory";
import { DatabaseProvider, DatabaseState } from "@/types";
import { getDatabase } from "@/lib/database-factory";

export const useDatabaseStore = create<DatabaseState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentBackend: getDatabaseBackend(),
      isTestMode: isGlobalTestMode(),
      db: getDatabase(),

      // Actions
      setBackend: async (backend: DatabaseBackend) => {
        // Update the global backend in the factory
        setDatabaseBackend(backend);

        // Get the new database instance
        const db = getDatabase();

        // Update the store
        set(
          {
            currentBackend: backend,
            db,
          },
          false,
          "setBackend",
        );

        // Initialize the database
        await db.initialize();
        await db.synchronizeNetworthHistory();
      },

      toggleTestMode: async () => {
        const { isTestMode, db } = get();
        const newTestMode = !isTestMode;

        // Update test mode in database instance
        db.setTestMode(newTestMode);

        // Update global test mode
        setGlobalTestMode(newTestMode);

        // Get new database instance
        const newDb = getDatabase();

        // Update store
        set(
          {
            isTestMode: newTestMode,
            db: newDb,
          },
          false,
          "toggleTestMode",
        );

        // Initialize the database
        await newDb.initialize();
        await newDb.synchronizeNetworthHistory();
      },

      refreshDatabase: async () => {
        const { currentBackend } = get();
        console.log(
          "Refreshing database connection with backend:",
          currentBackend,
        );

        // Get fresh database instance
        const db = getDatabase();

        // Update the store
        set({ db }, false, "refreshDatabase");

        // Initialize
        await db.initialize();
        await db.synchronizeNetworthHistory();
      },

      // Convenience methods for auth flows
      switchToSupabase: async () => {
        const { currentBackend, setBackend } = get();
        if (currentBackend !== "supabase") {
          await setBackend("supabase");
          console.log("Switched to Supabase backend");
        }
      },

      switchToLocal: async () => {
        const { currentBackend, setBackend } = get();
        if (currentBackend !== "local") {
          await setBackend("local");
          console.log("Switched to Local backend");
        }
      },
    }),
    { name: "database-store" },
  ),
);
