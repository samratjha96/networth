import { ReactNode, useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthProvider";
import { useDatabaseStore } from "@/store/database-store";

// DatabaseInitializer component - connects auth to database
const DatabaseInitializer = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const setUserId = useDatabaseStore((state) => state.setUserId);

  // Simple rule:
  // 1. If user session exists, use Supabase
  // 2. Otherwise, use local mode
  useEffect(() => {
    // This single call handles both setting the user ID and switching backend
    setUserId(user?.id || null);
  }, [user, setUserId]);

  return <>{children}</>;
};

// Main app provider that combines authentication and database initialization
export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <DatabaseInitializer>{children}</DatabaseInitializer>
    </AuthProvider>
  );
};
