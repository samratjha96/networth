import { useCallback } from "react";
import { Account } from "@/types/accounts";
import {
  useAccountsStore,
  useAccountsAutoReload,
} from "@/store/accounts-store";

interface UseAccountsResult {
  accounts: Account[];
  assetsAccounts: Account[];
  liabilitiesAccounts: Account[];
  isLoading: boolean;
  error: Error | null;
  addAccount: (account: Omit<Account, "id">) => Promise<Account>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

/**
 * Hook for managing accounts with asset/liability categorization
 */
export function useAccounts(): UseAccountsResult {
  const {
    accounts,
    isLoading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    loadAccounts,
  } = useAccountsStore();

  // Use auto-reload to keep accounts in sync with auth/database changes
  useAccountsAutoReload();

  // Split accounts into assets and liabilities
  const assetsAccounts = accounts.filter((account) => !account.isDebt);
  const liabilitiesAccounts = accounts.filter((account) => account.isDebt);

  // Function to refresh accounts data
  const refreshAccounts = useCallback(async () => {
    await loadAccounts();
  }, [loadAccounts]);

  return {
    accounts,
    assetsAccounts,
    liabilitiesAccounts,
    isLoading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    refreshAccounts,
  };
}
