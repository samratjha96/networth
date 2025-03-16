import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDatabase } from './database-factory';
import type { DatabaseProvider as DbProvider } from './types';

interface DatabaseContextType {
  db: DbProvider;
  isTestMode: boolean;
  toggleTestMode: () => Promise<void>;
  initialized: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  // Use a simple state with the function call to get the current DB
  // No need to track the DB as state since the factory handles the switching
  const db = getDatabase();
  const [isTestMode, setIsTestMode] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize database and sync test mode state on mount
  useEffect(() => {
    const initDb = async () => {
      await db.initialize();
      // Get initial test mode state
      setIsTestMode(db.isTestModeEnabled());
      
      // Run initial synchronization
      await db.synchronizeNetworthHistory();
      
      setInitialized(true);
    };
    
    initDb();
    
    // Cleanup on unmount
    return () => {
      // Close database connection if needed
    };
  }, [db]);
  
  const toggleTestMode = async () => {
    const newTestMode = !isTestMode;
    db.setTestMode(newTestMode);
    setIsTestMode(newTestMode);
    
    // Re-sync history data when test mode changes
    await db.synchronizeNetworthHistory();
    
    // Force page reload to refresh all components with new data
    window.location.reload();
  };
  
  return (
    <DatabaseContext.Provider value={{ db, isTestMode, toggleTestMode, initialized }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
} 