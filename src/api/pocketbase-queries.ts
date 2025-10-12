import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pocketbaseApi } from "./pocketbase-api";
import { sanitizeApiParams } from "@/utils/api-helpers";
import { sanitizeString } from "@/utils/input-validation";
import { AccountWithValue } from "@/types/accounts";
import { TimeRange } from "@/types/networth";
import { invalidateQueries } from "@/utils/query-invalidation";

// Auth Mutations for PocketBase
export const usePocketBaseSignIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const sanitizedParams = sanitizeApiParams({ email, password });
      const result = await pocketbaseApi.auth.signInWithPassword({
        email: sanitizedParams.email,
        password: sanitizedParams.password,
      });

      if (result.error) {
        throw new Error(result.error.message || "Sign in failed");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
};

export const usePocketBaseSignUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name: string;
    }) => {
      const sanitizedName = sanitizeString(name);
      const result = await pocketbaseApi.auth.signUp({
        email,
        password,
        name: sanitizedName,
      });

      if (result.error) {
        throw new Error(result.error.message || "Sign up failed");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
};

export const usePocketBaseSignOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pocketbaseApi.auth.signOut,
    onSuccess: () => {
      queryClient.invalidateQueries(); // Invalidate all queries when signing out
    },
  });
};

export const usePocketBaseSignInWithGoogle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await pocketbaseApi.auth.signInWithOAuth({
        provider: "google",
      });

      // If there's an error in the result, throw it
      if (result.error) {
        throw new Error(result.error.message || "OAuth2 authentication failed");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error) => {
      console.error("Google OAuth2 sign-in failed:", error);
    },
  });
};

// Account Queries for PocketBase
export const usePocketBaseAccounts = (userId: string | null) => {
  return useQuery({
    queryKey: ["accounts", userId],
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return pocketbaseApi.accounts.getAccounts(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePocketBaseAccountPerformance = (
  userId: string | null,
  timeRange: TimeRange,
  accounts: AccountWithValue[],
) => {
  const accountIds = accounts.map((account) => account.id);
  const accountsKey = accounts.map((a) => `${a.id}-${a.balance}`).join(",");

  return useQuery({
    queryKey: ["account-performance", userId, timeRange, accountsKey],
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return pocketbaseApi.accounts.getAccountPerformance(
        userId,
        timeRange,
        accountIds,
      );
    },
    enabled: !!userId && accounts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePocketBaseAccountHistory = (
  userId: string | null,
  accountId: string | null,
  timeRange: TimeRange,
) => {
  return useQuery({
    queryKey: ["account-history", userId, accountId, timeRange],
    queryFn: () => {
      if (!userId || !accountId) return Promise.resolve([]);
      return pocketbaseApi.accounts.getAccountHistory(
        userId,
        accountId,
        timeRange,
      );
    },
    enabled: !!userId && !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Account Mutations for PocketBase
export const usePocketBaseAddAccount = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountData: Omit<AccountWithValue, "id">) => {
      if (!userId) throw new Error("User ID is required");
      return pocketbaseApi.accounts.createAccount(userId, accountData);
    },
    onSuccess: (newAccount) => {
      invalidateQueries(queryClient, userId, {
        invalidateAccounts: true,
        invalidateNetWorth: true,
      });
    },
  });
};

export const usePocketBaseUpdateAccount = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountData: AccountWithValue) => {
      if (!userId) throw new Error("User ID is required");
      return pocketbaseApi.accounts.updateAccount(userId, accountData);
    },
    onSuccess: (_, variables) => {
      invalidateQueries(queryClient, userId, {
        invalidateAccounts: true,
        invalidateNetWorth: true,
        specificAccountIds: [variables.id],
      });
    },
  });
};

export const usePocketBaseDeleteAccount = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => {
      if (!userId) throw new Error("User ID is required");
      return pocketbaseApi.accounts.deleteAccount(userId, accountId);
    },
    onSuccess: (_, accountId) => {
      invalidateQueries(queryClient, userId, {
        invalidateAccounts: true,
        invalidateNetWorth: true,
        specificAccountIds: [accountId],
      });
    },
  });
};

// Networth Queries for PocketBase
export const usePocketBaseNetWorthHistory = (
  userId: string | null,
  timeRange: TimeRange,
) => {
  return useQuery({
    queryKey: ["networth-history", userId, timeRange],
    queryFn: () => {
      if (!userId) return Promise.resolve(null);
      return pocketbaseApi.networth.getLatestNetWorth(userId, timeRange);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePocketBaseNetWorthChartData = (
  userId: string | null,
  timeRange: TimeRange,
) => {
  return useQuery({
    queryKey: ["networth-chart-data", userId, timeRange],
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return pocketbaseApi.networth.getNetWorthHistory(userId, timeRange);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
