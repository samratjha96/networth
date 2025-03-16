import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { DatabaseBackend, getDatabaseInstance } from "@/lib/database-factory";
import { DatabaseProvider } from "@/types";
import { supabaseDb, useSupabase } from "@/lib/supabase-database";
import { db as mockDb } from "@/lib/database";

// Extended type for database store with backend state
type DatabaseState = {
  // Core state
  backend: DatabaseBackend;
  db: DatabaseProvider;

  // Backend selection
  setBackend: (backend: DatabaseBackend) => void;

  // Actions
  refreshDatabase: () => Promise<void>;

  // Auth related helpers
  setUserId: (userId: string | null) => Promise<void>;
};

export const useDatabaseStore = create<DatabaseState>()(
  devtools(
    (set, get) => ({
      // Initial state - start with local backend
      backend: "local",
      db: mockDb,

      // Set which backend to use
      setBackend: (backend: DatabaseBackend) => {
        const db = backend === "supabase" && supabaseDb ? supabaseDb : mockDb;
        console.log(`Setting database backend to ${backend}`);

        set({ backend, db }, false, `setBackend_${backend}`);
      },

      // Set user ID and switch to appropriate backend
      setUserId: async (userId: string | null) => {
        // Always update the user ID in Supabase provider
        if (supabaseDb) {
          supabaseDb.setUserId(userId);
        }

        // Determine appropriate backend
        const shouldUseSupabase = userId !== null && useSupabase;
        const newBackend: DatabaseBackend = shouldUseSupabase
          ? "supabase"
          : "local";

        // Update backend if changed
        if (newBackend !== get().backend) {
          get().setBackend(newBackend);
        }

        // Refresh to update data
        await get().refreshDatabase();
      },

      // Refresh database instance
      refreshDatabase: async () => {
        // Get the current backend and instance
        const { backend } = get();
        const db = getDatabaseInstance(backend);

        // Update the store with fresh instance
        set({ db }, false, "refreshDatabase");

        // Initialize and synchronize
        await db.initialize();
        await db.synchronizeNetworthHistory();
      },
    }),
    { name: "database-store" },
  ),
);
