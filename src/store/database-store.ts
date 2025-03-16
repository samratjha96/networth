import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getDatabase } from "@/lib/database-factory";
import { DatabaseProvider } from "@/types";

// Simple focused store that purely manages database operations
type DatabaseState = {
  // Core state
  db: DatabaseProvider;

  // Actions
  refreshDatabase: () => Promise<void>;
  toggleTestMode: () => Promise<void>;
};

export const useDatabaseStore = create<DatabaseState>()(
  devtools(
    (set, get) => ({
      // Database instance is the only state we need
      db: getDatabase(),

      // Refresh database instance
      refreshDatabase: async () => {
        // Get fresh database instance
        const db = getDatabase();

        // Update the store
        set({ db }, false, "refreshDatabase");

        // Initialize
        await db.initialize();
        await db.synchronizeNetworthHistory();
      },

      // Toggle test mode
      toggleTestMode: async () => {
        const { db } = get();
        const currentTestMode = db.isTestModeEnabled();
        const newTestMode = !currentTestMode;

        // Update test mode in database instance
        db.setTestMode(newTestMode);

        // Refresh the database to get the new test mode database
        await get().refreshDatabase();
      },
    }),
    { name: "database-store" },
  ),
);
