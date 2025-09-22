import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { MockDataService } from "@/services/MockDataService";
import { PocketbaseDataService } from "@/services/PocketbaseDataService";
import { AppDataContext, AppMode, DataSource } from "./app-data-context";
import { DataService } from "@/services/DataService";
import { AccountWithValue } from "@/types/accounts";

// Provider props
interface AppDataProviderProps {
  children: React.ReactNode;
}

// Utility function to determine data source from environment variables
const getDataSource = (): DataSource => {
  const useMock = import.meta.env.VITE_USE_MOCK === "true";

  if (useMock) return "mock";
  return "pocketbase"; // Default to PocketBase
};

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

  // Determine data source from environment
  const dataSource = useMemo(() => getDataSource(), []);

  // Create the appropriate data service
  const dataService: DataService = useMemo(() => {
    if (mode === "authenticated" && user?.id) {
      switch (dataSource) {
        case "pocketbase":
          return new PocketbaseDataService(user.id);
        default:
          return new MockDataService();
      }
    }
    return new MockDataService();
  }, [mode, user?.id, dataSource]);

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
      console.error("❌ AppDataContext: Failed to update account:", error);
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
