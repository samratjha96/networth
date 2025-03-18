import { create } from "zustand";
import { AccountWithValue } from "@/types/accounts";
import { useDatabaseStore } from "./database-store";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useRef } from "react";
import { useDb } from "@/components/DatabaseProvider";

interface AccountsState {
  // Account data state
  accounts: AccountWithValue[];
  isLoading: boolean;
  error: Error | null;

  // Dialog state
  isDialogOpen: boolean;
  accountToEdit: AccountWithValue | null;
  defaultIsDebt: boolean;

  // Action handlers
  // Account data actions
  addAccount: (
    account: Omit<AccountWithValue, "id">,
  ) => Promise<AccountWithValue>;
  updateAccount: (account: AccountWithValue) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Dialog actions
  openAddDialog: (options?: { isDebt?: boolean }) => void;
  openEditDialog: (account: AccountWithValue) => void;
  closeDialog: () => void;
}

export const useAccountsStore = create<AccountsState>((set, get) => {
  // Get the database from the database store (at store creation time)
  const getDb = () => {
    const db = useDatabaseStore.getState().db;
    return db;
  };

  return {
    // Initial account data state
    accounts: [],
    isLoading: false,
    error: null,

    // Initial dialog state
    isDialogOpen: false,
    accountToEdit: null,
    defaultIsDebt: false,

    // Dialog actions
    openAddDialog: (options?: { isDebt?: boolean }) =>
      set({
        isDialogOpen: true,
        accountToEdit: null,
        defaultIsDebt: options?.isDebt ?? false,
      }),

    openEditDialog: (account: AccountWithValue) =>
      set({ isDialogOpen: true, accountToEdit: account }),

    closeDialog: () => set({ isDialogOpen: false, accountToEdit: null }),

    // Add a new account
    addAccount: async (accountData: Omit<AccountWithValue, "id">) => {
      console.log("🔍 STORE: addAccount called", accountData);

      // Close the dialog immediately for better UX
      set({ isDialogOpen: false, accountToEdit: null });

      try {
        const db = getDb();

        // Apply optimistic update with a temporary ID
        const tempId = `temp-${Date.now()}`;
        const optimisticAccount = {
          ...accountData,
          id: tempId,
        } as AccountWithValue;

        // Update local state optimistically
        set((state) => ({
          accounts: [...state.accounts, optimisticAccount],
        }));

        console.log("✨ Applied optimistic update for add");

        // Perform the actual database update
        const newAccount = await db.insertAccount(accountData);

        // Update the state with the real account (replacing the temp one)
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === tempId ? newAccount : a,
          ),
        }));

        // Also trigger a networth history update
        await db.synchronizeNetworthHistory();

        return newAccount;
      } catch (err) {
        console.error("Error adding account:", err);
        // On error, remove the optimistic entry
        set((state) => ({
          accounts: state.accounts.filter((a) => !a.id.startsWith("temp-")),
          error: err instanceof Error ? err : new Error(String(err)),
        }));
        throw err;
      }
    },

    // Update an existing account
    updateAccount: async (account: AccountWithValue) => {
      console.log("🔍 STORE: updateAccount called directly:", account);

      // Close the dialog immediately for better UX if it's open
      if (get().isDialogOpen) {
        set({ isDialogOpen: false, accountToEdit: null });
      }

      try {
        const db = getDb();

        // Apply optimistic update immediately
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === account.id ? account : a,
          ),
        }));

        console.log("✨ Applied optimistic update for edit");

        // Perform the actual database update
        await db.updateAccount(account);

        console.log(
          "🔍 STORE: account updated in database, syncing networth history",
        );

        // Update networth history
        await db.synchronizeNetworthHistory();
      } catch (err) {
        console.error("Error updating account:", err);

        // On error, we should invalidate and fetch fresh data
        try {
          const db = getDb();
          const freshAccounts = await db.getAllAccounts();
          set({
            accounts: freshAccounts,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        } catch (fetchErr) {
          console.error("Failed to fetch fresh data after error:", fetchErr);
        }

        throw err;
      }
    },

    // Delete an account
    deleteAccount: async (id: string) => {
      try {
        const db = getDb();

        // Store the account for potential recovery
        const accountToDelete = get().accounts.find((a) => a.id === id);

        // Apply optimistic update immediately
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        }));

        console.log("✨ Applied optimistic update for delete");

        // Perform the actual database deletion
        await db.deleteAccount(id);

        // Update networth history
        await db.synchronizeNetworthHistory();
      } catch (err) {
        console.error("Error deleting account:", err);

        // On error, restore the deleted account if we have it
        const accountToDelete = get().accounts.find((a) => a.id === id);
        if (accountToDelete) {
          set((state) => ({
            accounts: [...state.accounts, accountToDelete],
            error: err instanceof Error ? err : new Error(String(err)),
          }));
        } else {
          // If we don't have the account, fetch fresh data
          try {
            const db = getDb();
            const freshAccounts = await db.getAllAccounts();
            set({
              accounts: freshAccounts,
              error: err instanceof Error ? err : new Error(String(err)),
            });
          } catch (fetchErr) {
            console.error("Failed to fetch fresh data after error:", fetchErr);
          }
        }

        throw err;
      }
    },
  };
});
