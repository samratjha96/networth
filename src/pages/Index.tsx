import { useMemo, useEffect, useState } from "react";
import { useNetworthHistory } from "@/hooks/use-networth-history";
import { useAccountPerformance } from "@/hooks/use-account-performance";
import { NetWorthSummary } from "@/components/NetWorthSummary";
import { NetWorthChart } from "@/components/NetWorthChart";
import { AccountsList } from "@/components/AccountsList";
import { CurrencyCode, TimeRange } from "@/types";
import { TestModeToggle } from "@/components/TestModeToggle";
import { useDatabase } from "@/hooks/use-database";
import { Header } from "@/components/Header";
import { useAccountsStore } from "@/store/accounts-store";

const DEFAULT_CURRENCY: CurrencyCode = "USD";

const Index = () => {
  // Default time period for consistency between summary and chart
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimeRange>(7);
  const { db } = useDatabase();
  const { accounts } = useAccountsStore();

  useEffect(() => {
    document.title = "Argos | Your Net Worth Guardian";
  }, []);

  // Get account performance data
  const { bestPerformer, isLoading: isPerformanceLoading } =
    useAccountPerformance(accounts, "month");

  // Calculate current net worth from accounts (source of truth)
  const currentNetWorth = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts],
  );

  // Calculate asset and liability totals for verification
  const assetsTotal = useMemo(
    () =>
      accounts
        .filter((account) => !account.isDebt)
        .reduce((sum, account) => sum + account.balance, 0),
    [accounts],
  );

  const liabilitiesTotal = useMemo(
    () =>
      accounts
        .filter((account) => account.isDebt)
        .reduce((sum, account) => sum + Math.abs(account.balance), 0),
    [accounts],
  );

  // Verify net worth calculation matches assets minus liabilities
  useEffect(() => {
    const calculatedNetWorth = assetsTotal - liabilitiesTotal;
    const discrepancy = Math.abs(calculatedNetWorth - currentNetWorth);

    if (discrepancy > 0.01) {
      // Allow for tiny floating point differences
      console.warn("Net worth calculation discrepancy detected:", {
        fromAccounts: currentNetWorth,
        fromAssetLiabilityCalc: calculatedNetWorth,
        assets: assetsTotal,
        liabilities: liabilitiesTotal,
        discrepancy,
      });
    }
  }, [currentNetWorth, assetsTotal, liabilitiesTotal]);

  // Fetch the net worth history using the hook that deals with caching
  const { data: networthHistory, isLoading: isNetworthHistoryLoading } =
    useNetworthHistory(selectedTimePeriod);

  // Find the previous net worth from the history
  const previousNetWorth = useMemo(() => {
    if (networthHistory.length > 1) {
      // Get the oldest data point in the history
      return networthHistory[0].value;
    }
    // If there's only the current value, there's no change
    return currentNetWorth;
  }, [networthHistory, currentNetWorth]);

  // Calculate the change in net worth
  const netWorthChange = currentNetWorth - previousNetWorth;

  // Calculate the percentage change
  const changePercentage = previousNetWorth
    ? (netWorthChange / Math.abs(previousNetWorth)) * 100
    : 0;

  // Best performing account, based on data from the hook
  const bestPerformingAccount = bestPerformer;

  // Handle time period changes from the chart
  const handleTimeRangeChange = (days: number) => {
    setSelectedTimePeriod(days as TimeRange);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        {/* Use the new Header component */}
        <Header />

        <NetWorthSummary
          currentNetWorth={currentNetWorth}
          previousNetWorth={previousNetWorth}
          netWorthChange={netWorthChange}
          changePercentage={changePercentage}
          currency={DEFAULT_CURRENCY}
          bestPerformingAccount={bestPerformingAccount}
        />

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
          <NetWorthChart
            currency={DEFAULT_CURRENCY}
            currentNetWorth={currentNetWorth}
            onTimeRangeChange={handleTimeRangeChange}
            initialTimeRange={selectedTimePeriod}
          />
        </div>

        <AccountsList />
      </div>
    </div>
  );
};

export default Index;
