import { create } from "zustand";
import { Account } from "@/types/accounts";
import { useAccountsStore } from "./accounts-store";

interface AccountDialogState {
  // Dialog state
  isOpen: boolean;
  accountToEdit: Account | null;
  defaultIsDebt: boolean;

  // Actions
  openAddDialog: (options?: { isDebt?: boolean }) => void;
  openEditDialog: (account: Account) => void;
  closeDialog: () => void;

  // Operation handlers
  addAccount: (account: Omit<Account, "id">) => Promise<void>;
  editAccount: (account: Account) => Promise<void>;
}

export const useAccountDialogStore = create<AccountDialogState>((set, get) => ({
  // Initial state
  isOpen: false,
  accountToEdit: null,
  defaultIsDebt: false,

  // Dialog control actions
  openAddDialog: (options?: { isDebt?: boolean }) =>
    set({
      isOpen: true,
      accountToEdit: null,
      defaultIsDebt: options?.isDebt ?? false,
    }),
  openEditDialog: (account: Account) =>
    set({ isOpen: true, accountToEdit: account }),
  closeDialog: () => set({ isOpen: false, accountToEdit: null }),

  // Account operations
  addAccount: async (accountData: Omit<Account, "id">) => {
    // Close the dialog
    set({ isOpen: false });

    // Call the actual account operation from the accounts store
    try {
      const accountsStore = useAccountsStore.getState();
      await accountsStore.addAccount(accountData);
    } catch (error) {
      console.error("Failed to add account:", error);
    }
  },

  editAccount: async (account: Account) => {
    // Close the dialog
    set({ isOpen: false, accountToEdit: null });

    // Call the actual account operation from the accounts store
    try {
      const accountsStore = useAccountsStore.getState();
      await accountsStore.updateAccount(account);
    } catch (error) {
      console.error("Failed to update account:", error);
    }
  },
}));
