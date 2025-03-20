import { create } from "zustand";
import { AccountWithValue } from "@/types/accounts";
import { getMockDataInstance } from "@/lib/mock-data";

interface AccountsState {
  // Account data state
  accounts: AccountWithValue[];
  
  // Dialog state
  isDialogOpen: boolean;
  accountToEdit: AccountWithValue | null;
  defaultIsDebt: boolean;

  // Action handlers
  // Account data actions
  addAccount: (account: Omit<AccountWithValue, "id">) => Promise<AccountWithValue>;
  updateAccount: (account: AccountWithValue) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Dialog actions
  openAddDialog: (options?: { isDebt?: boolean }) => void;
  openEditDialog: (account: AccountWithValue) => void;
  closeDialog: () => void;
}

export const useAccountsStore = create<AccountsState>((set, get) => {
  // Get mock data
  const { accounts: initialAccounts } = getMockDataInstance();

  return {
    // Initial account data state with mock data
    accounts: initialAccounts,
    
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
      // Close the dialog immediately for better UX
      set({ isDialogOpen: false, accountToEdit: null });

      // Create a new account with a unique ID
      const newAccount = {
        ...accountData,
        id: `account-${Date.now()}`,
      } as AccountWithValue;

      // Update local state
      set((state) => ({
        accounts: [...state.accounts, newAccount],
      }));

      return newAccount;
    },

    // Update an existing account
    updateAccount: async (account: AccountWithValue) => {
      // Close the dialog immediately for better UX if it's open
      if (get().isDialogOpen) {
        set({ isDialogOpen: false, accountToEdit: null });
      }

      // Update the account in state
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === account.id ? account : a
        ),
      }));
    },

    // Delete an account
    deleteAccount: async (id: string) => {
      // Remove the account from state
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id),
      }));
    },
  };
});
