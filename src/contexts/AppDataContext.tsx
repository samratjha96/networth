import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { DataService } from "@/services/DataService";
import { MockDataService } from "@/services/MockDataService";
import { SupabaseDataService } from "@/services/SupabaseDataService";
import { AccountWithValue } from "@/types/accounts";
import { NetworthHistory, TimeRange } from "@/types/networth";

// The app can be in one of these modes
type AppMode = "demo" | "authenticated";

// Context interface
interface AppDataContextValue {
  // Mode
  mode: AppMode;
  userId: string | null;

  // Data service (abstracted for components)
  dataService: DataService;

  // Account operations
  addAccount: (
    account: Omit<AccountWithValue, "id">,
  ) => Promise<AccountWithValue>;
  updateAccount: (account: AccountWithValue) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Derived state calculated from mode changes
  isDemo: boolean;
  isAuthenticated: boolean;

  // Utility
  invalidateQueries: () => Promise<void>;
}

// Create the context
const AppDataContext = createContext<AppDataContextValue | null>(null);

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

// Hook for using the context
export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
