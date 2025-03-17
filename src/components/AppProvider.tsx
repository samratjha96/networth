import { ReactNode, useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthProvider";
import { useDatabaseStore } from "@/store/database-store";
import { DatabaseProvider } from "./DatabaseProvider";
import { useQueryClient } from "@tanstack/react-query";

// Component to connect auth to database
const AuthToDatabaseConnector = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const setUserId = useDatabaseStore((state) => state.setUserId);
  const queryClient = useQueryClient();

  // Connect auth user to database when user changes
  useEffect(() => {
    console.debug("User changed, updating database userId:", user?.id || null);

    // First update the user ID in the database store
    setUserId(user?.id || null);

    // Then invalidate all queries to ensure fresh data is loaded
    setTimeout(() => {
      console.debug("Invalidating queries after user/database change");
      queryClient.invalidateQueries();
    }, 0);
  }, [user, setUserId, queryClient]);

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
