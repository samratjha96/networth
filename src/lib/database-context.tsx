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
import type { DatabaseProvider as DbProvider } from "@/types";
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
  const [db, setDb] = useState(getDatabase());
  const [currentBackend, setCurrentBackend] = useState(getDatabaseBackend());
  const [isTestMode, setIsTestMode] = useState(isGlobalTestMode());
  const [initialized, setInitialized] = useState(false);

  // Initialize test mode on the actual database instance to match global setting
  useEffect(() => {
    if (isGlobalTestMode() !== db.isTestModeEnabled()) {
      db.setTestMode(isGlobalTestMode());
      setIsTestMode(isGlobalTestMode());
    }
  }, [db]);

  // Combined effect for handling backend changes and initialization
  useEffect(() => {
    const initializeDatabase = async () => {
      const newBackend = getDatabaseBackend();

      // If backend changed, update the database instance
      if (newBackend !== currentBackend) {
        setInitialized(false);
        setCurrentBackend(newBackend);
        const newDb = getDatabase();
        setDb(newDb);

        // Initialize the new database instance
        await newDb.initialize();
        setIsTestMode(isGlobalTestMode());
        await newDb.synchronizeNetworthHistory();
        setInitialized(true);
      } else if (!initialized) {
        // If backend hasn't changed but we're not initialized, initialize current db
        await db.initialize();
        setIsTestMode(isGlobalTestMode());
        await db.synchronizeNetworthHistory();
        setInitialized(true);
      }
    };

    initializeDatabase();
  }, [currentBackend, db, initialized]);

  const toggleTestMode = async () => {
    setInitialized(false);
    const newTestMode = !isTestMode;

    // Update the database instance
    db.setTestMode(newTestMode);
    setGlobalTestMode(newTestMode);
    setIsTestMode(newTestMode);

    // Get and initialize the new database instance
    const newDb = getDatabase();
    setDb(newDb);
    await newDb.initialize();
    await newDb.synchronizeNetworthHistory();
    setInitialized(true);
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
