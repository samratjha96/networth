import { ReactNode, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { useDatabaseStore } from "@/store/database-store";

interface DatabaseSyncProviderProps {
  children: ReactNode;
}

export function DatabaseSyncProvider({ children }: DatabaseSyncProviderProps) {
  const { user, isLoading } = useAuth();
  const { switchToSupabase, switchToLocal } = useDatabaseStore();

  // Effect to sync auth state with database backend
  useEffect(() => {
    if (isLoading) return;

    const syncBackendWithAuth = async () => {
      if (user) {
        // User is authenticated, use Supabase
        await switchToSupabase();
      } else {
        // User is not authenticated, use local storage
        await switchToLocal();
      }
    };

    syncBackendWithAuth();
  }, [user, isLoading, switchToSupabase, switchToLocal]);

  return <>{children}</>;
}
