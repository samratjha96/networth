import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseApi } from "./supabase-api";
import { AccountWithValue } from "@/types/accounts";
import { TimeRange } from "@/types/networth";
import { invalidateQueries } from "@/utils/query-invalidation";

// Auth Queries
export const useSession = () => {
  return useQuery({
    queryKey: ["session"],
    queryFn: supabaseApi.auth.getSession,
    staleTime: Infinity, // Session data doesn't change unless explicitly mutated
  });
};

export const useUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: supabaseApi.auth.getUser,
    staleTime: Infinity, // User data doesn't change unless explicitly mutated
  });
};

// Auth Mutations
export const useSignIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      supabaseApi.auth.signInWithPassword({
        email,
        password,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
};

export const useSignUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name: string;
    }) =>
      supabaseApi.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
};

export const useSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: supabaseApi.auth.signOut,
    onSuccess: () => {
      queryClient.invalidateQueries(); // Invalidate all queries when signing out
    },
  });
};

export const useSignInWithGoogle = () => {
  return useMutation({
    mutationFn: () =>
      supabaseApi.auth.signInWithOAuth({
        provider: "google",
      }),
  });
};

// Account Queries
export const useAccounts = (userId: string | null) => {
  return useQuery({
    queryKey: ["accounts", userId],
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return supabaseApi.accounts.getAccounts(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAccountPerformance = (
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
      return supabaseApi.accounts.getAccountPerformance(
        userId,
        timeRange,
        accountIds,
      );
    },
    enabled: !!userId && accounts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Account Mutations
export const useAddAccount = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountData: Omit<AccountWithValue, "id">) => {
      if (!userId) throw new Error("User ID is required");
      return supabaseApi.accounts.createAccount(userId, accountData);
    },
    onSuccess: (newAccount) => {
      invalidateQueries(queryClient, userId, {
        invalidateAccounts: true,
        invalidateNetWorth: true,
      });
    },
  });
};

export const useUpdateAccount = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountData: AccountWithValue) => {
      if (!userId) throw new Error("User ID is required");
      return supabaseApi.accounts.updateAccount(userId, accountData);
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

export const useDeleteAccount = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => {
      if (!userId) throw new Error("User ID is required");
      return supabaseApi.accounts.deleteAccount(userId, accountId);
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

// Networth Queries
export const useNetWorthHistory = (
  userId: string | null,
  timeRange: TimeRange,
) => {
  return useQuery({
    queryKey: ["networth-history", userId, timeRange],
    queryFn: () => {
      if (!userId) return Promise.resolve(null);
      return supabaseApi.networth.getLatestNetWorth(userId, timeRange);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useNetWorthChartData = (
  userId: string | null,
  timeRange: TimeRange,
) => {
  return useQuery({
    queryKey: ["networth-chart-data", userId, timeRange],
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return supabaseApi.networth.getNetWorthHistory(userId, timeRange);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Networth Mutation
export const useUpdateNetWorth = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currentNetWorth: number) => {
      if (!userId) throw new Error("User ID is required");
      return supabaseApi.networth.updateNetWorthHistory(
        userId,
        currentNetWorth,
      );
    },
    onSuccess: () => {
      invalidateQueries(queryClient, userId, {
        invalidateNetWorth: true,
      });
    },
  });
};
