import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { DatabaseBackend, getDatabaseInstance } from "@/lib/database-factory";
import { DatabaseProvider } from "@/types";
import { supabaseDb, useSupabase } from "@/lib/supabase-database";
import { db as mockDb } from "@/lib/database";

// Local storage key for persisting backend type
export const LS_BACKEND_TYPE_KEY = "argos-db-backend-type";

// Type for database store with backend state
type DatabaseState = {
  // Core state
  backend: DatabaseBackend;
  db: DatabaseProvider;

  // Actions
  setBackend: (backend: DatabaseBackend) => void;
  setUserId: (userId: string | null) => void;
};

export const useDatabaseStore = create<DatabaseState>()(
  devtools(
    (set) => ({
      // Initial state - get from local storage or default to local
      backend:
        (localStorage.getItem(LS_BACKEND_TYPE_KEY) as DatabaseBackend) ||
        "local",
      db:
        localStorage.getItem(LS_BACKEND_TYPE_KEY) === "supabase" && supabaseDb
          ? supabaseDb
          : mockDb,

      // Set which backend to use - purely declarative
      setBackend: (backend: DatabaseBackend) => {
        const db = backend === "supabase" && supabaseDb ? supabaseDb : mockDb;
        console.log(`Setting database backend to ${backend}`);

        // Store in local storage for persistence
        localStorage.setItem(LS_BACKEND_TYPE_KEY, backend);

        // Update state with new backend and db
        set({ backend, db }, false, `setBackend_${backend}`);
      },

      // Set user ID and switch to appropriate backend
      setUserId: (userId: string | null) => {
        // Update the user ID in Supabase provider
        if (supabaseDb) {
          supabaseDb.setUserId(userId);
        }

        // Determine appropriate backend
        const shouldUseSupabase = userId !== null && useSupabase;
        const newBackend: DatabaseBackend = shouldUseSupabase
          ? "supabase"
          : "local";

        // Update backend if changed
        if (newBackend !== "supabase" || supabaseDb) {
          set(
            {
              backend: newBackend,
              db: newBackend === "supabase" ? supabaseDb : mockDb,
            },
            false,
            `setUserId_${newBackend}`,
          );

          // Store in local storage
          localStorage.setItem(LS_BACKEND_TYPE_KEY, newBackend);
        }
      },
    }),
    { name: "database-store" },
  ),
);
