import { AccountWithValue } from "@/types/accounts";
import { useAccountsStore } from "@/store/accounts-store";
import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/components/DatabaseProvider";
import React from "react";

interface UseAccountsResult {
  accounts: AccountWithValue[];
  assetsAccounts: AccountWithValue[];
  liabilitiesAccounts: AccountWithValue[];
  isLoading: boolean;
  error: Error | null;
  addAccount: (
    account: Omit<AccountWithValue, "id">,
  ) => Promise<AccountWithValue>;
  updateAccount: (account: AccountWithValue) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

// Helper for logging with timestamps
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
  console.log(`TESTING: [${timestamp}] ${message}`, data ? data : "");
};

export function useAccounts(): UseAccountsResult {
  const {
    addAccount,
    updateAccount,
    deleteAccount,
    accounts: storeAccounts,
    isLoading: storeIsLoading,
    error: storeError,
  } = useAccountsStore();
  const { db, backendType } = useDb();

  React.useEffect(() => {
    // Fetch accounts on mount or when dependencies change
    const fetchAccounts = async () => {
      // Only fetch if the store doesn't already have accounts
      if (storeAccounts.length === 0 && !storeIsLoading) {
        log(`🔄 Initial fetch of accounts from database: ${backendType}`);
        try {
          const accounts = await db.getAllAccounts();
          log(
            `✅ Fetched ${accounts.length} accounts from ${backendType} backend`,
          );
          useAccountsStore.setState({ accounts, isLoading: false });
        } catch (error) {
          log(`❌ Error fetching accounts:`, error);
          useAccountsStore.setState({
            error: error instanceof Error ? error : new Error(String(error)),
            isLoading: false,
          });
        }
      }
    };

    fetchAccounts();
  }, [db, backendType, storeAccounts.length, storeIsLoading]);

  // Process account data for derived states
  const accounts = storeAccounts;
  const assetsAccounts = accounts.filter((account) => !account.isDebt);
  const liabilitiesAccounts = accounts.filter((account) => account.isDebt);

  return {
    accounts,
    assetsAccounts,
    liabilitiesAccounts,
    isLoading: storeIsLoading,
    error: storeError,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}
