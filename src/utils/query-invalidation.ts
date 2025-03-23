import { QueryClient } from "@tanstack/react-query";

/**
 * Utility to invalidate TanStack Query cache when data changes
 */
export function invalidateQueries(
  queryClient: QueryClient,
  userId: string | null,
  options: {
    invalidateNetWorth?: boolean;
    invalidateAccounts?: boolean;
    specificAccountIds?: string[];
  } = {},
) {
  const { invalidateNetWorth, invalidateAccounts, specificAccountIds } =
    options;

  if (invalidateNetWorth) {
    queryClient.invalidateQueries({ queryKey: ["networth-history", userId] });
  }

  if (invalidateAccounts) {
    if (specificAccountIds && specificAccountIds.length > 0) {
      // Invalidate specific accounts
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as (string | string[])[];
          return (
            queryKey[0] === "account-performance" &&
            queryKey[1] === userId &&
            specificAccountIds.some((id) => queryKey[3]?.includes(id))
          );
        },
      });
    } else {
      // Invalidate all account data
      queryClient.invalidateQueries({
        queryKey: ["account-performance", userId],
      });
    }
  }
}

/**
 * Configure optimistic updates for account operations
 */
export function configureOptimisticUpdates(queryClient: QueryClient) {
  return {
    // Optimistically update account balance
    updateAccountBalance: (accountId: string, newBalance: number) => {
      // Update account performance queries
      queryClient.setQueriesData(
        { queryKey: ["account-performance"] },
        (old: any) => {
          if (!old) return old;
          return old.map((account: any) => {
            if (account.accountId === accountId) {
              return {
                ...account,
                endValue: newBalance,
                absoluteChange: newBalance - account.startValue,
                percentChange:
                  account.startValue !== 0
                    ? ((newBalance - account.startValue) /
                        Math.abs(account.startValue)) *
                      100
                    : 0,
              };
            }
            return account;
          });
        },
      );
    },

    // Optimistically update net worth
    updateNetWorth: (newNetWorth: number) => {
      // Update net worth history queries
      queryClient.setQueriesData(
        { queryKey: ["networth-history"] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            currentValue: newNetWorth,
            change: newNetWorth - old.previousValue,
            percentageChange:
              old.previousValue !== 0
                ? ((newNetWorth - old.previousValue) /
                    Math.abs(old.previousValue)) *
                  100
                : 0,
          };
        },
      );
    },
  };
}
