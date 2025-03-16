import { create } from "zustand";
import { Account } from "@/types";
import { useDatabaseStore } from "./database-store";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useRef } from "react";
import { useDb } from "@/components/DatabaseProvider";

interface AccountsState {
  // State
  accounts: Account[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  loadAccounts: () => Promise<void>;
  addAccount: (account: Omit<Account, "id">) => Promise<Account>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export const useAccountsStore = create<AccountsState>((set, get) => {
  // Get the database from the database store (at store creation time)
  const getDb = () => {
    const db = useDatabaseStore.getState().db;
    return db;
  };

  return {
    // Initial state
    accounts: [],
    isLoading: false,
    error: null,

    // Load all accounts
    loadAccounts: async () => {
      try {
        set({ isLoading: true });
        const db = getDb();
        console.debug("Loading accounts from database");
        const accounts = await db.getAllAccounts();
        console.debug(`Loaded ${accounts.length} accounts`);
        set({ accounts, isLoading: false, error: null });
      } catch (err) {
        console.error("Error loading accounts:", err);
        set({
          error:
            err instanceof Error ? err : new Error("Failed to load accounts"),
          isLoading: false,
        });
      }
    },

    // Add a new account
    addAccount: async (accountData: Omit<Account, "id">) => {
      try {
        const db = getDb();
        const newAccount = await db.insertAccount(accountData);

        set((state) => ({
          accounts: [...state.accounts, newAccount],
        }));

        // Also trigger a networth history update
        await db.synchronizeNetworthHistory();

        return newAccount;
      } catch (err) {
        console.error("Error adding account:", err);
        throw err;
      }
    },

    // Update an existing account
    updateAccount: async (account: Account) => {
      try {
        const db = getDb();
        await db.updateAccount(account);

        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === account.id ? account : a,
          ),
        }));

        // Update networth history
        await db.synchronizeNetworthHistory();
      } catch (err) {
        console.error("Error updating account:", err);
        throw err;
      }
    },

    // Delete an account
    deleteAccount: async (id: string) => {
      try {
        const db = getDb();
        await db.deleteAccount(id);

        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        }));

        // Update networth history
        await db.synchronizeNetworthHistory();
      } catch (err) {
        console.error("Error deleting account:", err);
        throw err;
      }
    },
  };
});

// Hook to auto-reload accounts when auth state or database backend changes
export function useAccountsAutoReload() {
  const { user } = useAuth();
  const loadAccounts = useAccountsStore((state) => state.loadAccounts);
  const { backendType } = useDb();

  // Load accounts when any dependency changes
  useEffect(() => {
    console.debug("User or backend changed, reloading accounts", {
      userId: user?.id,
      backendType,
    });
    loadAccounts();
  }, [user, backendType, loadAccounts]);
}
