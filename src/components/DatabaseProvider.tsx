import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useDatabaseStore, LS_BACKEND_TYPE_KEY } from "@/store/database-store";
import { DatabaseProvider as DatabaseProviderType } from "@/types/database";
import { DatabaseBackend } from "@/lib/database-factory";

// Context type
type DatabaseContextType = {
  db: DatabaseProviderType;
  backendType: DatabaseBackend;
  isLoading: boolean;
};

// Create context with default values
const DatabaseContext = createContext<DatabaseContextType>({
  db: {} as DatabaseProviderType,
  backendType: "local",
  isLoading: true,
});

// Custom hook to use the database context
export const useDb = () => useContext(DatabaseContext);

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  // Get database-related state from store
  const { db: storeDb, backend } = useDatabaseStore();
  const [isLoading, setIsLoading] = useState(true);

  // Mark loading as false when we have a database
  useEffect(() => {
    if (storeDb) {
      console.debug(`Database provider initialized: ${backend}`);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [storeDb, backend]);

  // Listen for local storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LS_BACKEND_TYPE_KEY) {
        console.log("Backend type changed in another tab/window");
        // The database store will handle this internally
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Value to provide to context consumers
  const contextValue = {
    db: storeDb || ({} as DatabaseProviderType),
    backendType: backend,
    isLoading,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
}
