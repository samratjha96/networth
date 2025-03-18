import { create } from "zustand";
import { AccountWithValue } from "@/types/accounts";
import { useAccountsStore } from "@/store/accounts-store";

interface AccountDialogState {
  // Dialog state
  isOpen: boolean;
  accountToEdit: AccountWithValue | null;
  defaultIsDebt: boolean;

  // Actions
  openAddDialog: (options?: { isDebt?: boolean }) => void;
  openEditDialog: (account: AccountWithValue) => void;
  closeDialog: () => void;

  // Operation handlers
  addAccount: (account: Omit<AccountWithValue, "id">) => Promise<void>;
  editAccount: (account: AccountWithValue) => Promise<void>;
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
  openEditDialog: (account: AccountWithValue) =>
    set({ isOpen: true, accountToEdit: account }),
  closeDialog: () => set({ isOpen: false, accountToEdit: null }),

  // Account operations
  addAccount: async (accountData: Omit<AccountWithValue, "id">) => {
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

  editAccount: async (account: AccountWithValue) => {
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
