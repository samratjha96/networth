// ABOUTME: Standardized accounts hook using TanStack Query best practices
// ABOUTME: Demonstrates proper query keys, optimistic updates, and error handling

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountWithValue } from "@/types/accounts";
import { DataService } from "@/services/DataService";
import { queryKeys } from "@/lib/query-keys";
import { createQueryOptions } from "@/lib/query-options";
import {
  createOptimisticAddMutation,
  createOptimisticUpdateMutation,
  createOptimisticDeleteMutation,
  createAccountMutations,
} from "@/lib/mutation-factories";
import { useMemo } from "react";

interface UseAccountsStandardOptions {
  userId: string | null;
  dataService: DataService;
}

/**
 * Standardized accounts hook following TanStack Query best practices
 */
export function useAccountsStandard({
  userId,
  dataService,
}: UseAccountsStandardOptions) {
  const queryClient = useQueryClient();

  // Create standardized query options
  const accountsQueryOptions = createQueryOptions<AccountWithValue[]>(
    {
      queryKey: queryKeys.accounts(userId),
      queryFn: async () => {
        if (!userId) return [];
        return await dataService.getAccounts();
      },
      enabled: !!userId,
    },
    "realtime", // Real-time data that changes frequently
  );

  // Fetch accounts with standardized options
  const {
    data: accounts = [],
    isLoading,
    error,
    refetch,
  } = useQuery(accountsQueryOptions);

  // Get mutation helpers
  const {
    accountsQueryKey,
    updateAccountRelatedQueries,
    generateOptimisticAccount,
  } = createAccountMutations(userId, queryClient);

  // Create standardized mutations with optimistic updates
  const addAccountMutation = createOptimisticAddMutation(
    queryClient,
    async (accountData: Omit<AccountWithValue, "id">) => {
      if (!userId) throw new Error("User must be authenticated");
      return await dataService.addAccount(accountData);
    },
    {
      userId,
      queryKey: accountsQueryKey,
      generateOptimisticItem: generateOptimisticAccount,
      updateRelatedQueries: updateAccountRelatedQueries,
    },
  );

  const updateAccountMutation = createOptimisticUpdateMutation(
    queryClient,
    async (account: AccountWithValue) => {
      if (!userId) throw new Error("User must be authenticated");
      await dataService.updateAccount(account);
      return account;
    },
    {
      userId,
      queryKey: accountsQueryKey,
      updateRelatedQueries: updateAccountRelatedQueries,
    },
  );

  const deleteAccountMutation = createOptimisticDeleteMutation(
    queryClient,
    async (accountId: string) => {
      if (!userId) throw new Error("User must be authenticated");
      await dataService.deleteAccount(accountId);
    },
    {
      userId,
      queryKey: accountsQueryKey,
      updateRelatedQueries: (queryClient, deletedId, remainingAccounts) => {
        updateAccountRelatedQueries(
          queryClient,
          { id: deletedId } as AccountWithValue,
          remainingAccounts,
        );
      },
    },
  );

  // Memoized calculations to avoid re-computing on every render
  const totals = useMemo(() => {
    const totalAssets = accounts
      .filter((account) => !account.isDebt)
      .reduce((sum, account) => sum + account.balance, 0);

    const totalLiabilities = accounts
      .filter((account) => account.isDebt)
      .reduce((sum, account) => Math.abs(sum + account.balance), 0);

    const netWorth = totalAssets - totalLiabilities;

    return { totalAssets, totalLiabilities, netWorth };
  }, [accounts]);

  // Memoized grouped accounts for performance
  const accountGroups = useMemo(() => {
    const assets = accounts.filter((account) => !account.isDebt);
    const liabilities = accounts.filter((account) => account.isDebt);
    return { assets, liabilities };
  }, [accounts]);

  return {
    // Data
    accounts,
    ...totals,
    ...accountGroups,

    // Loading states
    isLoading,
    error,

    // Actions
    addAccount: addAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    refetch,

    // Async actions (for more control)
    addAccountAsync: addAccountMutation.mutateAsync,
    updateAccountAsync: updateAccountMutation.mutateAsync,
    deleteAccountAsync: deleteAccountMutation.mutateAsync,

    // Mutation states
    isAdding: addAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,

    // Mutation errors
    addError: addAccountMutation.error,
    updateError: updateAccountMutation.error,
    deleteError: deleteAccountMutation.error,

    // Combined states for convenience
    isAnyMutationPending:
      addAccountMutation.isPending ||
      updateAccountMutation.isPending ||
      deleteAccountMutation.isPending,

    hasAnyError: !!(
      error ||
      addAccountMutation.error ||
      updateAccountMutation.error ||
      deleteAccountMutation.error
    ),

    // Reset functions
    resetAddError: addAccountMutation.reset,
    resetUpdateError: updateAccountMutation.reset,
    resetDeleteError: deleteAccountMutation.reset,

    // Query meta information
    queryKey: accountsQueryKey,
    lastFetched: accountsQueryOptions.queryKey
      ? queryClient.getQueryState(accountsQueryOptions.queryKey)?.dataUpdatedAt
      : undefined,
  };
}

/**
 * Type for the hook return value
 */
export type UseAccountsStandardReturn = ReturnType<typeof useAccountsStandard>;
