import { create } from "zustand";
import { Account } from "@/types";
import { useDatabaseStore } from "./database-store";

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
        const accounts = await db.getAllAccounts();
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
