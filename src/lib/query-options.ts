// ABOUTME: Standardized query options factory for TanStack Query
// ABOUTME: Provides consistent configurations for queries and mutations

import { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";

/**
 * Standard query options based on data freshness requirements
 */
export const queryOptions = {
  // Real-time data that changes frequently (account balances, net worth)
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  // Static data that rarely changes (account names, types)
  stable: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  // Background data for charts/analytics
  background: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  // Authentication data
  auth: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
} as const;

/**
 * Create enabled option based on required dependencies
 */
export const createEnabledOption = (...dependencies: unknown[]) => ({
  enabled: dependencies.every(dep => dep != null && dep !== undefined),
});

/**
 * Standard error retry configuration
 */
export const retryConfig = {
  // For user actions (mutations)
  userAction: {
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // For background data fetching
  background: {
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  // For critical data
  critical: {
    retry: 5,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
} as const;

/**
 * Helper to create consistent query options
 */
export const createQueryOptions = <TData = unknown, TError = Error>(
  baseOptions: Partial<UseQueryOptions<TData, TError>> = {},
  optionType: keyof typeof queryOptions = 'realtime'
): UseQueryOptions<TData, TError> => ({
  ...queryOptions[optionType],
  ...retryConfig.background,
  ...baseOptions,
});

/**
 * Helper to create consistent mutation options
 */
export const createMutationOptions = <TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  baseOptions: Partial<UseMutationOptions<TData, TError, TVariables, TContext>> = {}
): UseMutationOptions<TData, TError, TVariables, TContext> => ({
  ...retryConfig.userAction,
  ...baseOptions,
});