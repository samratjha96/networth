import { useMemo, useState, useEffect } from "react";
import { useNetworthHistory } from "./use-networth-history";
import { useTimeRangeStore } from "@/store/time-range-store";
import { useAccountPerformance } from "@/hooks/accounts/use-account-performance";
import { useAccounts } from "@/hooks/accounts/use-accounts";
import { CurrencyCode } from "@/types/currency";
import { useDb } from "@/components/DatabaseProvider";

const DEFAULT_CURRENCY: CurrencyCode = "USD";
const INITIAL_RENDER_DELAY_MS = 100;

interface FinancialMetrics {
  currentNetWorth: number;
  assetsTotal: number;
  liabilitiesTotal: number;
}

interface NetworthChanges {
  previousNetWorth: number;
  netWorthChange: number;
  changePercentage: number;
}

interface UseNetWorthSummaryResult {
  currentNetWorth: number;
  netWorthChange: number;
  changePercentage: number;
  currency: CurrencyCode;
  bestPerformingAccount: any; // Type from useAccountPerformance
  isLoading: boolean;
  backendType: string;
}

function calculateFinancialMetrics(accounts: any[] = []): FinancialMetrics {
  const assetsAccounts = accounts.filter((account) => !account.isDebt);
  const liabilitiesAccounts = accounts.filter((account) => account.isDebt);

  const assetsTotal = assetsAccounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  const liabilitiesTotal = liabilitiesAccounts.reduce(
    (sum, account) => sum + Math.abs(account.balance),
    0,
  );

  return {
    currentNetWorth: assetsTotal - liabilitiesTotal,
    assetsTotal,
    liabilitiesTotal,
  };
}

function calculateChanges(
  networthHistory: Array<{ value: number }> = [],
  currentNetWorth: number,
): NetworthChanges {
  const previousNetWorth =
    networthHistory.length > 1 ? networthHistory[0].value : currentNetWorth;

  const netWorthChange = currentNetWorth - previousNetWorth;
  const changePercentage = previousNetWorth
    ? (netWorthChange / Math.abs(previousNetWorth)) * 100
    : 0;

  return {
    previousNetWorth,
    netWorthChange,
    changePercentage,
  };
}

export function useNetWorthSummary(): UseNetWorthSummaryResult {
  const { backendType } = useDb();
  const [initialRender, setInitialRender] = useState(true);
  const timeRange = useTimeRangeStore((state) => state.timeRange);
  
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { bestPerformer, isLoading: performanceLoading } = useAccountPerformance(accounts, timeRange);
  const { data: networthHistory, isLoading: historyLoading } = useNetworthHistory(timeRange);

  // Handle initial render and backend changes
  useEffect(() => {
    if (initialRender) {
      const timer = setTimeout(() => setInitialRender(false), INITIAL_RENDER_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [initialRender]);

  useEffect(() => {
    setInitialRender(true);
  }, [backendType]);

  // Calculate metrics
  const financialMetrics = useMemo(
    () => calculateFinancialMetrics(accounts),
    [accounts]
  );

  const changes = useMemo(
    () => calculateChanges(networthHistory, financialMetrics.currentNetWorth),
    [networthHistory, financialMetrics.currentNetWorth]
  );

  const isLoading = initialRender || accountsLoading || (historyLoading && !networthHistory?.length);

  return {
    currentNetWorth: financialMetrics.currentNetWorth,
    netWorthChange: changes.netWorthChange,
    changePercentage: changes.changePercentage,
    currency: DEFAULT_CURRENCY,
    bestPerformingAccount: bestPerformer,
    isLoading,
    backendType,
  };
}
