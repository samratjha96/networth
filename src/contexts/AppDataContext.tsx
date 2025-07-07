import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { MockDataService } from "@/services/MockDataService";
import { SupabaseDataService } from "@/services/SupabaseDataService";
import { AppDataContext } from "./app-data-context";

// Provider props
interface AppDataProviderProps {
  children: React.ReactNode;
}

// Provider component
export function AppDataProvider({ children }: AppDataProviderProps) {
  // Get auth state from the store
  const { user, status } = useAuthStore();

  // Get query client for cache invalidation
  const queryClient = useQueryClient();

  // Determine app mode based on auth status
  const mode: AppMode = useMemo(() => {
    // Use demo mode if unauthenticated, error, or connection timeout
    return status === "authenticated" ? "authenticated" : "demo";
  }, [status]);

  // Create the appropriate data service
  const dataService: DataService = useMemo(() => {
    return mode === "authenticated" && user?.id
      ? new SupabaseDataService(user.id)
      : new MockDataService();
  }, [mode, user?.id]);

  // Helper derived values
  const isDemo = mode === "demo";
  const isAuthenticated = mode === "authenticated";
  const userId = user?.id || null;

  // Invalidate all queries when mode changes
  // We intentionally only depend on mode and queryClient here since we want to
  // invalidate all queries whenever the app mode changes (demo/authenticated)
  useEffect(() => {
    queryClient.invalidateQueries();
  }, [mode, queryClient]);

  // Invalidate queries utility
  const invalidateQueries = async () => {
    await queryClient.invalidateQueries();
  };

  // Wrap operations to handle errors and loading states
  const addAccount = async (accountData: Omit<AccountWithValue, "id">) => {
    try {
      const newAccount = await dataService.addAccount(accountData);
      await invalidateQueries();
      return newAccount;
    } catch (error) {
      console.error("Failed to add account:", error);
      throw error;
    }
  };

  const updateAccount = async (account: AccountWithValue) => {
    try {
      await dataService.updateAccount(account);
      await invalidateQueries();
    } catch (error) {
      console.error("Failed to update account:", error);
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await dataService.deleteAccount(id);
      await invalidateQueries();
    } catch (error) {
      console.error("Failed to delete account:", error);
      throw error;
    }
  };

  // Context value to expose to components
  const contextValue = {
    mode,
    userId,
    dataService,
    addAccount,
    updateAccount,
    deleteAccount,
    isDemo,
    isAuthenticated,
    invalidateQueries,
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
}

// Hook moved to separate file to avoid React Fast Refresh warning:
// src/hooks/app-context/use-app-data.ts
