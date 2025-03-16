import { ReactNode, useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthProvider";
import { useDatabaseStore } from "@/store/database-store";
import { DatabaseProvider } from "./DatabaseProvider";

// Component to connect auth to database
const AuthToDatabaseConnector = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const setUserId = useDatabaseStore((state) => state.setUserId);

  // Connect auth user to database when user changes
  useEffect(() => {
    console.debug("User changed, updating database userId:", user?.id || null);
    setUserId(user?.id || null);
  }, [user, setUserId]);

  return <>{children}</>;
};

// Main app provider that combines all app-wide state providers
export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <AuthToDatabaseConnector>
        <DatabaseProvider>{children}</DatabaseProvider>
      </AuthToDatabaseConnector>
    </AuthProvider>
  );
};
