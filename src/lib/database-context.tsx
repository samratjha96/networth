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
  currentBackend: DatabaseBackend;
  refreshDatabase: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(
  undefined,
);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState(getDatabase());
  const [currentBackend, setCurrentBackend] = useState(getDatabaseBackend());
  const [isTestMode, setIsTestMode] = useState(isGlobalTestMode());

  // Initialize test mode on the actual database instance to match global setting
  useEffect(() => {
    if (isGlobalTestMode() !== db.isTestModeEnabled()) {
      db.setTestMode(isGlobalTestMode());
      setIsTestMode(isGlobalTestMode());
    }
  }, [db]);

  // Initialize database function that can be called manually
  const initializeDatabase = useCallback(async () => {
    const newBackend = getDatabaseBackend();
    console.debug(
      "Initializing database with backend:",
      newBackend,
      "current:",
      currentBackend,
    );

    // If backend changed, update the database instance
    if (newBackend !== currentBackend) {
      setCurrentBackend(newBackend);
      const newDb = getDatabase();
      setDb(newDb);
      await newDb.initialize();
      setIsTestMode(isGlobalTestMode());
      await newDb.synchronizeNetworthHistory();
    } else {
      await db.initialize();
      await db.synchronizeNetworthHistory();
    }
  }, [currentBackend, db]);

  // Effect for handling backend changes
  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  // Listen for custom backend change events
  useEffect(() => {
    const handleBackendChange = (event: Event) => {
      console.debug("Detected database backend change event");
      const customEvent = event as CustomEvent;
      const { backend } = customEvent.detail;

      if (backend !== currentBackend) {
        console.debug(
          `Backend changed from ${currentBackend} to ${backend}, refreshing database`,
        );
        setCurrentBackend(backend);
        // Directly trigger initialization instead of waiting for the effect
        initializeDatabase();
      }
    };

    window.addEventListener("database-backend-changed", handleBackendChange);

    return () => {
      window.removeEventListener(
        "database-backend-changed",
        handleBackendChange,
      );
    };
  }, [initializeDatabase, currentBackend]);

  const toggleTestMode = async () => {
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
  };

  // Function to force a database refresh
  const refreshDatabase = async () => {
    console.log("Manually refreshing database connection");
    await initializeDatabase();
  };

  return (
    <DatabaseContext.Provider
      value={{
        db,
        isTestMode,
        toggleTestMode,
        currentBackend,
        refreshDatabase,
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
