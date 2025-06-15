import { createContext } from "react";
import { DataService } from "@/services/DataService";
import { AccountWithValue } from "@/types/accounts";

// The app can be in one of these modes
export type AppMode = "demo" | "authenticated";

// Context interface
export interface AppDataContextValue {
  // Mode
  mode: AppMode;
  userId: string | null;

  // Data service (abstracted for components)
  dataService: DataService;

  // Account operations
  addAccount: (
    account: Omit<AccountWithValue, "id">
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
export const AppDataContext = createContext<AppDataContextValue | null>(null);