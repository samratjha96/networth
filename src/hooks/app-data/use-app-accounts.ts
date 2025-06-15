import { useQuery, useMutation } from "@tanstack/react-query";
import { useAppData } from "@/hooks/app-context";
import { AccountWithValue } from "@/types/accounts";

/**
 * Hook for working with accounts data
 */
export function useAppAccounts() {
  const {
    dataService,
    mode,
    invalidateQueries,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useAppData();

  // Fetch accounts
  const {
    data: accounts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["accounts", mode],
    queryFn: () => dataService.getAccounts(),
  });

  // Mutation for adding account (integrated with context)
  const addAccountMutation = useMutation({
    mutationFn: addAccount,
    onSuccess: () => {
      invalidateQueries();
    },
  });

  // Mutation for updating account
  const updateAccountMutation = useMutation({
    mutationFn: updateAccount,
    onSuccess: () => {
      invalidateQueries();
    },
  });

  // Mutation for deleting account
  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      invalidateQueries();
    },
  });

  // Calculate totals
  const totalAssets = accounts
    .filter((account) => !account.isDebt)
    .reduce((sum, account) => sum + account.balance, 0);

  const totalLiabilities = accounts
    .filter((account) => account.isDebt)
    .reduce((sum, account) => Math.abs(sum + account.balance), 0);

  const netWorth = totalAssets - totalLiabilities;

  return {
    // Data
    accounts,
    totalAssets,
    totalLiabilities,
    netWorth,

    // Loading state
    isLoading,
    error,

    // Operations
    addAccount: addAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,

    // Operation states
    isAdding: addAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,
    operationError:
      addAccountMutation.error ||
      updateAccountMutation.error ||
      deleteAccountMutation.error,
  };
}
