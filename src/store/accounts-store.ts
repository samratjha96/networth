import { create } from "zustand";
import { AccountWithValue, AccountType } from "@/types/accounts";
import { CurrencyCode } from "@/types/currency";
import { getMockDataInstance } from "@/lib/mock-data";
import { pocketbaseApi } from "@/api/pocketbase-api";
import { sanitizeAccountData } from "@/utils/api-helpers";

// Define a store type to keep our implementation clean
interface AccountsState {
  // Account data state
  accounts: AccountWithValue[];
  isLoading: boolean;
  dataSource: "local" | "remote"; // Track data source in the store
  userId: string | null; // Track user ID in the store

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

  // Internal synchronization
  syncRemoteAccounts: (accounts: AccountWithValue[]) => void;
  setDataSourceInfo: (
    dataSource: "local" | "remote",
    userId: string | null,
  ) => void;

  // Dialog actions
  openAddDialog: (options?: { isDebt?: boolean }) => void;
  openEditDialog: (account: AccountWithValue) => void;
  closeDialog: () => void;
}

// Calculate total net worth from accounts
const calculateNetWorth = (accounts: AccountWithValue[]): number => {
  return accounts.reduce((total, account) => total + account.balance, 0);
};

// Update networth history if using remote data
const updateNetWorthIfRemote = async (
  dataSource: "local" | "remote",
  userId: string | null,
  accounts: AccountWithValue[],
): Promise<void> => {
  if (dataSource === "remote" && userId) {
    const totalNetWorth = calculateNetWorth(accounts);
    try {
      await pocketbaseApi.networth.updateNetWorthHistory(userId, totalNetWorth);
    } catch (err) {
      console.error("Failed to update networth history:", err);
    }
  }
};

export const useAccountsStore = create<AccountsState>((set, get) => {
  // Get mock data for initial local state
  const { accounts: initialAccounts } = getMockDataInstance();

  return {
    // Initial account data state with mock data
    accounts: initialAccounts,
    isLoading: false,
    dataSource: "local",
    userId: null,

    // Initial dialog state
    isDialogOpen: false,
    accountToEdit: null,
    defaultIsDebt: false,

    // Update data source info
    setDataSourceInfo: (
      dataSource: "local" | "remote",
      userId: string | null,
    ) => {
      set({ dataSource, userId });
    },

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

    // Sync remote accounts to the store
    syncRemoteAccounts: (accounts: AccountWithValue[]) => {
      // Always force a new array reference to ensure React detects the change
      set({ accounts: [...accounts] });
    },

    // Add a new account
    addAccount: async (accountData: Omit<AccountWithValue, "id">) => {
      // Close the dialog immediately for better UX
      set({ isDialogOpen: false, accountToEdit: null, isLoading: true });

      try {
        // Get data source info from the store
        const { dataSource, userId } = get();
        let newAccount: AccountWithValue;

        // Sanitize input data
        const sanitizedData = sanitizeAccountData(accountData) as Omit<
          AccountWithValue,
          "id"
        >;

        if (dataSource === "remote" && userId) {
          // Remote operation through API
          newAccount = await pocketbaseApi.accounts.createAccount(
            userId,
            sanitizedData,
          );
        } else {
          // Local operation (original implementation)
          newAccount = {
            ...sanitizedData,
            id: `account-${Date.now()}`,
          } as AccountWithValue;
        }

        // Update local state (optimistic update)
        set((state) => {
          const updatedAccounts = [...state.accounts, newAccount];

          // Update networth history if needed
          updateNetWorthIfRemote(dataSource, userId, updatedAccounts);

          return {
            accounts: updatedAccounts,
            isLoading: false,
          };
        });

        return newAccount;
      } catch (error) {
        console.error("Error adding account:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    // Update an existing account
    updateAccount: async (account: AccountWithValue) => {
      // Close the dialog immediately for better UX if it's open
      if (get().isDialogOpen) {
        set({ isDialogOpen: false, accountToEdit: null });
      }

      set({ isLoading: true });

      try {
        // Get data source info from the store
        const { dataSource, userId } = get();

        // Sanitize input data
        const sanitizedAccount = sanitizeAccountData(
          account,
        ) as AccountWithValue;

        if (dataSource === "remote" && userId) {
          // Remote operation through API
          await pocketbaseApi.accounts.updateAccount(userId, sanitizedAccount);
        }

        // Update the account in state (optimistic update)
        set((state) => {
          const updatedAccounts = state.accounts.map((a) =>
            a.id === account.id ? sanitizedAccount : a,
          );

          // Update networth history if needed
          updateNetWorthIfRemote(dataSource, userId, updatedAccounts);

          return {
            accounts: updatedAccounts,
            isLoading: false,
          };
        });
      } catch (error) {
        console.error("Error updating account:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    // Delete an account
    deleteAccount: async (id: string) => {
      set({ isLoading: true });

      try {
        // Get data source info from the store
        const { dataSource, userId } = get();

        if (dataSource === "remote" && userId) {
          // Remote operation through API
          await pocketbaseApi.accounts.deleteAccount(userId, id);
        }

        // Remove the account from state (optimistic update)
        set((state) => {
          const updatedAccounts = state.accounts.filter((a) => a.id !== id);

          // Update networth history if needed
          updateNetWorthIfRemote(dataSource, userId, updatedAccounts);

          return {
            accounts: updatedAccounts,
            isLoading: false,
          };
        });
      } catch (error) {
        console.error("Error deleting account:", error);
        set({ isLoading: false });
        throw error;
      }
    },
  };
});
