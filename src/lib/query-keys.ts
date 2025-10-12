// ABOUTME: Centralized query key factory with TypeScript types for TanStack Query
// ABOUTME: Provides consistent, typed query keys across the application

import { TimeRange } from "@/types/networth";

/**
 * Query key factory following TanStack Query best practices
 * https://tanstack.com/query/latest/docs/react/guides/query-keys#query-key-factories
 */
export const queryKeys = {
  // Base keys
  all: ['networth'] as const,

  // User-scoped keys
  users: (userId: string | null) => [...queryKeys.all, 'users', userId] as const,

  // Account keys
  accounts: (userId: string | null) => [...queryKeys.users(userId), 'accounts'] as const,
  account: (userId: string | null, accountId: string) => [...queryKeys.accounts(userId), accountId] as const,

  // Performance keys
  performance: (userId: string | null) => [...queryKeys.users(userId), 'performance'] as const,
  accountPerformance: (userId: string | null, timeRange: TimeRange) =>
    [...queryKeys.performance(userId), 'accounts', timeRange] as const,
  networthPerformance: (userId: string | null, timeRange: TimeRange) =>
    [...queryKeys.performance(userId), 'networth', timeRange] as const,

  // Net worth keys
  networth: (userId: string | null) => [...queryKeys.users(userId), 'networth'] as const,
  networthHistory: (userId: string | null, timeRange: TimeRange) =>
    [...queryKeys.networth(userId), 'history', timeRange] as const,
  networthChart: (userId: string | null, timeRange: TimeRange) =>
    [...queryKeys.networth(userId), 'chart', timeRange] as const,
} as const;

/**
 * Query key type utilities for better TypeScript inference
 */
export type QueryKeys = typeof queryKeys;
export type AccountsKey = ReturnType<typeof queryKeys.accounts>;
export type AccountKey = ReturnType<typeof queryKeys.account>;
export type NetworthHistoryKey = ReturnType<typeof queryKeys.networthHistory>;
export type AccountPerformanceKey = ReturnType<typeof queryKeys.accountPerformance>;
export type NetworthPerformanceKey = ReturnType<typeof queryKeys.networthPerformance>;

/**
 * Helper to invalidate all queries for a user
 */
export const getUserQueryKey = (userId: string | null) => queryKeys.users(userId);

/**
 * Helper to get all account-related query keys
 */
export const getAccountQueryKeys = (userId: string | null) => ({
  all: queryKeys.accounts(userId),
  performance: (timeRange: TimeRange) => queryKeys.accountPerformance(userId, timeRange),
});

/**
 * Helper to get all networth-related query keys
 */
export const getNetworthQueryKeys = (userId: string | null) => ({
  all: queryKeys.networth(userId),
  history: (timeRange: TimeRange) => queryKeys.networthHistory(userId, timeRange),
  chart: (timeRange: TimeRange) => queryKeys.networthChart(userId, timeRange),
  performance: (timeRange: TimeRange) => queryKeys.networthPerformance(userId, timeRange),
});