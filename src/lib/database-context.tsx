import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  getDatabase,
  getDatabaseBackend,
  setGlobalTestMode,
  isGlobalTestMode,
} from "./database-factory";
import type { DatabaseProvider as DbProvider } from "./types";
import type { DatabaseBackend } from "./database-factory";

interface DatabaseContextType {
  db: DbProvider;
  isTestMode: boolean;
  toggleTestMode: () => Promise<void>;
  initialized: boolean;
  currentBackend: DatabaseBackend;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(
  undefined,
);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage/factory
  const [db, setDb] = useState(getDatabase());
  const [currentBackend, setCurrentBackend] = useState(getDatabaseBackend());
  const [isTestMode, setIsTestMode] = useState(isGlobalTestMode());
  const [initialized, setInitialized] = useState(false);

  // Initialize test mode on the actual database instance to match global setting
  useEffect(() => {
    // When component mounts, ensure db instance has the correct test mode
    if (isGlobalTestMode() !== db.isTestModeEnabled()) {
      db.setTestMode(isGlobalTestMode());
      setIsTestMode(isGlobalTestMode());
    }
  }, []);

  // Check if the database backend has changed and update accordingly
  useEffect(() => {
    const newBackend = getDatabaseBackend();
    if (newBackend !== currentBackend) {
      setCurrentBackend(newBackend);
      setDb(getDatabase());
      setInitialized(false); // Reset initialized state when backend changes
    }
  }, [currentBackend]);

  // Initialize database and sync test mode state on mount or when db changes
  useEffect(() => {
    const initDb = async () => {
      if (!initialized) {
        await db.initialize();
        // Get initial test mode state
        setIsTestMode(isGlobalTestMode());

        // Run initial synchronization
        await db.synchronizeNetworthHistory();

        setInitialized(true);
      }
    };

    initDb();

    // Cleanup on unmount
    return () => {
      // Close database connection if needed
    };
  }, [db, initialized]);

  const toggleTestMode = async () => {
    const newTestMode = !isTestMode;

    // First update the database instance
    db.setTestMode(newTestMode);

    // Then update the global factory state
    setGlobalTestMode(newTestMode);

    // Update the local state
    setIsTestMode(newTestMode);

    // Get the possibly new database instance
    const newDb = getDatabase();
    if (newDb !== db) {
      setDb(newDb);
      await newDb.initialize();
    }

    // Re-sync history data when test mode changes
    await newDb.synchronizeNetworthHistory();

    // Force page reload to refresh all components with new data
    window.location.reload();
  };

  return (
    <DatabaseContext.Provider
      value={{
        db,
        isTestMode,
        toggleTestMode,
        initialized,
        currentBackend,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
}
