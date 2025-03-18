import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { DatabaseBackend, DatabaseFactory } from "@/lib/database-factory";
import { DatabaseProvider } from "@/types/database";
import { useSupabase } from "@/lib/supabase-database";

// Local storage key for persisting backend type
export const LS_BACKEND_TYPE_KEY = "argos-db-backend-type";

// Type for database store with backend state
type DatabaseState = {
  // Core state
  backend: DatabaseBackend;
  db: DatabaseProvider | null;
  userId: string | null;

  // Actions
  setBackend: (backend: DatabaseBackend) => void;
  setUserId: (userId: string | null) => void;
};

export const useDatabaseStore = create<DatabaseState>()(
  devtools(
    (set, get) => ({
      // Initial state - don't create a DB provider yet
      backend:
        (localStorage.getItem(LS_BACKEND_TYPE_KEY) as DatabaseBackend) ||
        "local",
      db: null,
      userId: null,

      // Set which backend to use
      setBackend: (backend: DatabaseBackend) => {
        const { userId } = get();
        console.log(`Setting database backend to ${backend}`);

        // Store in local storage for persistence
        localStorage.setItem(LS_BACKEND_TYPE_KEY, backend);

        // Create appropriate database provider
        const db = DatabaseFactory.createProvider(backend, userId);

        // Update state
        set({ backend, db }, false, `setBackend_${backend}`);
      },

      // Set user ID and switch to appropriate backend
      setUserId: (userId: string | null) => {
        // Get current state for cleanup
        const { db: currentDb, backend: currentBackend } = get();

        // Determine appropriate backend based on user state
        const shouldUseSupabase = userId !== null && useSupabase;
        const newBackend: DatabaseBackend = shouldUseSupabase
          ? "supabase"
          : "local";

        console.debug(
          `Setting userId to ${userId}, using ${newBackend} database`,
        );

        // Cleanup current database if needed
        if (currentDb && currentBackend !== newBackend) {
          console.debug(
            `Cleaning up ${currentBackend} database before switching to ${newBackend}`,
          );
          // Allow the database to clean up any resources
          if (typeof currentDb.cleanup === "function") {
            currentDb.cleanup();
          }
        }

        // Create appropriate database provider
        const db = DatabaseFactory.createProvider(newBackend, userId);

        // Update state
        set(
          {
            userId,
            backend: newBackend,
            db,
          },
          false,
          `setUserId_${newBackend}`,
        );

        // Store in local storage
        localStorage.setItem(LS_BACKEND_TYPE_KEY, newBackend);
      },
    }),
    { name: "database-store" },
  ),
);
