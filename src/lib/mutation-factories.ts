// ABOUTME: Reusable mutation factories with optimistic updates for TanStack Query
// ABOUTME: Provides standardized patterns for CRUD operations with rollback support

import { QueryClient, useMutation } from "@tanstack/react-query";
import { AccountWithValue } from "@/types/accounts";
import { queryKeys } from "./query-keys";
import { createMutationOptions } from "./query-options";

/**
 * Helper to calculate net worth from accounts
 */
export const calculateNetWorth = (accounts: AccountWithValue[]): number => {
  const totalAssets = accounts
    .filter((account) => !account.isDebt)
    .reduce((sum, account) => sum + account.balance, 0);

  const totalLiabilities = accounts
    .filter((account) => account.isDebt)
    .reduce((sum, account) => Math.abs(sum + account.balance), 0);

  return totalAssets - totalLiabilities;
};

/**
 * Update net worth queries optimistically
 */
export const updateNetworthQueries = (
  queryClient: QueryClient,
  userId: string | null,
  newNetWorth: number,
) => {
  // Update only networth performance queries (not account performance)
  queryClient.setQueriesData(
    { queryKey: [...queryKeys.performance(userId), "networth"] },
    (old: unknown) => {
      if (!old || typeof old !== "object") return old;

      const record = old as Record<string, unknown>;
      const previousValue =
        typeof record.previousValue === "number" ? record.previousValue : 0;

      return {
        ...record,
        currentValue: newNetWorth,
        change: newNetWorth - previousValue,
        percentageChange:
          previousValue !== 0
            ? ((newNetWorth - previousValue) / Math.abs(previousValue)) * 100
            : 0,
      };
    },
  );
};

/**
 * Factory for creating optimistic add mutations
 */
export const useOptimisticAddMutation = <
  TData extends { id: string },
  TInput = Omit<TData, "id">,
>(
  queryClient: QueryClient,
  mutationFn: (input: TInput) => Promise<TData>,
  options: {
    userId: string | null;
    queryKey: readonly unknown[];
    generateOptimisticItem: (input: TInput) => TData;
    updateRelatedQueries?: (
      queryClient: QueryClient,
      newItem: TData,
      allItems: TData[],
    ) => void;
  },
) => {
  return useMutation(
    createMutationOptions<
      TData,
      Error,
      TInput,
      { previous: TData[] | undefined; optimistic: TData }
    >({
      mutationFn,
      onMutate: async (input: TInput) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: options.queryKey });

        // Snapshot the previous value
        const previous = queryClient.getQueryData<TData[]>(options.queryKey);

        // Create optimistic item
        const optimistic = options.generateOptimisticItem(input);

        // Optimistically update
        const newItems = [...(previous || []), optimistic];
        queryClient.setQueryData<TData[]>(options.queryKey, newItems);

        // Update related queries
        options.updateRelatedQueries?.(queryClient, optimistic, newItems);

        return { previous, optimistic };
      },
      onSuccess: (realItem, _variables, context) => {
        // Replace optimistic item with real item
        queryClient.setQueryData<TData[]>(options.queryKey, (old = []) =>
          old.map((item) =>
            item.id === context?.optimistic.id ? realItem : item,
          ),
        );
      },
      onError: (_error, _variables, context) => {
        // Rollback on error
        if (context?.previous) {
          queryClient.setQueryData(options.queryKey, context.previous);

          // Rollback related queries if needed
          if (context.previous.length > 0) {
            options.updateRelatedQueries?.(
              queryClient,
              context.optimistic,
              context.previous,
            );
          }
        }
      },
    }),
  );
};

/**
 * Factory for creating optimistic update mutations
 */
export const useOptimisticUpdateMutation = <TData extends { id: string }>(
  queryClient: QueryClient,
  mutationFn: (item: TData) => Promise<void | TData>,
  options: {
    userId: string | null;
    queryKey: readonly unknown[];
    updateRelatedQueries?: (
      queryClient: QueryClient,
      updatedItem: TData,
      allItems: TData[],
    ) => void;
  },
) => {
  return useMutation(
    createMutationOptions<
      void | TData,
      Error,
      TData,
      { previous: TData[] | undefined }
    >({
      mutationFn,
      onMutate: async (updatedItem: TData) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: options.queryKey });

        // Snapshot the previous value
        const previous = queryClient.getQueryData<TData[]>(options.queryKey);

        // Optimistically update
        const newItems = (previous || []).map((item) =>
          item.id === updatedItem.id ? updatedItem : item,
        );
        queryClient.setQueryData<TData[]>(options.queryKey, newItems);

        // Update related queries
        options.updateRelatedQueries?.(queryClient, updatedItem, newItems);

        return { previous };
      },
      onError: (_error, variables, context) => {
        // Rollback on error
        if (context?.previous) {
          queryClient.setQueryData(options.queryKey, context.previous);

          // Rollback related queries
          if (context.previous.length > 0) {
            options.updateRelatedQueries?.(
              queryClient,
              variables,
              context.previous,
            );
          }
        }
      },
    }),
  );
};

/**
 * Factory for creating optimistic delete mutations
 */
export const useOptimisticDeleteMutation = <TData extends { id: string }>(
  queryClient: QueryClient,
  mutationFn: (id: string) => Promise<void>,
  options: {
    userId: string | null;
    queryKey: readonly unknown[];
    updateRelatedQueries?: (
      queryClient: QueryClient,
      deletedId: string,
      remainingItems: TData[],
    ) => void;
  },
) => {
  return useMutation(
    createMutationOptions<
      void,
      Error,
      string,
      { previous: TData[] | undefined; deleted: TData | undefined }
    >({
      mutationFn,
      onMutate: async (itemId: string) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: options.queryKey });

        // Snapshot the previous value
        const previous = queryClient.getQueryData<TData[]>(options.queryKey);
        const deleted = previous?.find((item) => item.id === itemId);

        // Optimistically remove
        const newItems = (previous || []).filter((item) => item.id !== itemId);
        queryClient.setQueryData<TData[]>(options.queryKey, newItems);

        // Update related queries
        options.updateRelatedQueries?.(queryClient, itemId, newItems);

        return { previous, deleted };
      },
      onError: (_error, variables, context) => {
        // Rollback on error
        if (context?.previous) {
          queryClient.setQueryData(options.queryKey, context.previous);

          // Rollback related queries
          if (context.deleted) {
            options.updateRelatedQueries?.(
              queryClient,
              variables,
              context.previous,
            );
          }
        }
      },
    }),
  );
};

/**
 * Account-specific mutation factories with net worth updates
 */
export const createAccountMutations = (
  userId: string | null,
  _queryClient: QueryClient,
) => {
  const accountsQueryKey = queryKeys.accounts(userId);

  const updateAccountRelatedQueries = (
    queryClient: QueryClient,
    _account: AccountWithValue,
    allAccounts: AccountWithValue[],
  ) => {
    const newNetWorth = calculateNetWorth(allAccounts);
    updateNetworthQueries(queryClient, userId, newNetWorth);
  };

  return {
    accountsQueryKey,
    updateAccountRelatedQueries,
    generateOptimisticAccount: (
      input: Omit<AccountWithValue, "id">,
    ): AccountWithValue => ({
      ...input,
      id: `temp-${Date.now()}-${Math.random()}`,
    }),
  };
};
