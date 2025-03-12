import { useMemo, useEffect, useState, useRef } from "react";
import { useAccounts } from "@/hooks/use-accounts";
import { useNetworthHistory } from "@/hooks/use-networth-history";
import { useAccountPerformance } from "@/hooks/use-account-performance";
import { NetWorthSummary } from "@/components/NetWorthSummary";
import { NetWorthChart } from "@/components/NetWorthChart";
import { AccountsList, Account, CurrencyCode } from "@/components/AccountsList";
import { AddAccountDialog } from "@/components/AddAccountDialog";
import { TestModeToggle } from "@/components/TestModeToggle";
import { db } from "@/lib/database";

const DEFAULT_CURRENCY: CurrencyCode = "USD";

const Index = () => {
  // Default time period for consistency between summary and chart
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(30); // Default to month view

  // Use a ref to track initialization to prevent multiple calls
  const initializedRef = useRef(false);

  useEffect(() => {
    document.title = "Argos | Your Net Worth Guardian";

    // Synchronize the networth history with current account data on initial load
    // Only do this once to prevent infinite updates
    if (!initializedRef.current) {
      db.synchronizeNetworthHistory();
      initializedRef.current = true;
    }
  }, []);

  const { accounts, addAccount, updateAccount, deleteAccount } = useAccounts();

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

  // Get networth history data using the selected time period
  const { data: networthHistory = [] } = useNetworthHistory(
    selectedTimePeriod,
    accounts,
  );

  // When accounts change, update the networth snapshot
  useEffect(() => {
    // Only update if we have accounts and not in test mode
    if (accounts.length > 0 && !db.isTestModeEnabled()) {
      // Ensure the current net worth is reflected in history
      db.addNetworthSnapshot(currentNetWorth);
    }
  }, [accounts, currentNetWorth]);

  // Find the value from the exact start of the selected time period
  const previousNetWorth = useMemo(() => {
    if (networthHistory.length <= 1) return currentNetWorth;

    // Sort by date to find entries in chronological order
    const sorted = [...networthHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Use the first (oldest) entry in the time period
    return sorted[0]?.value || currentNetWorth;
  }, [networthHistory, currentNetWorth]);

  // Get the current net worth from the latest history entry
  const historyNetWorth = useMemo(() => {
    if (networthHistory.length === 0) return currentNetWorth;

    // Sort by date to find entries in chronological order
    const sorted = [...networthHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Use the latest entry to ensure we're consistent with the chart
    return sorted[0]?.value || currentNetWorth;
  }, [networthHistory, currentNetWorth]);

  // Calculate change amount and percentage based on history data
  const netWorthChange = historyNetWorth - previousNetWorth;

  // For negative values, we need to handle the percentage calculation differently
  const changePercentage = useMemo(() => {
    if (previousNetWorth === 0) return 0;

    // For negative net worth values
    if (previousNetWorth < 0 && historyNetWorth < 0) {
      // Both negative - look at the change in absolute values
      const prevAbs = Math.abs(previousNetWorth);
      const currAbs = Math.abs(historyNetWorth);

      // If abs value increased (got worse), negative percentage
      // If abs value decreased (got better), positive percentage
      return ((prevAbs - currAbs) / prevAbs) * 100;
    }

    // Standard calculation for positive values
    return (netWorthChange / Math.abs(previousNetWorth)) * 100;
  }, [historyNetWorth, previousNetWorth, netWorthChange]);

  const handleAddAccount = (newAccount: Omit<Account, "id">) => {
    addAccount(newAccount);
  };

  const handleEditAccount = (account: Account) => {
    updateAccount(account);
  };

  const handleDeleteAccount = (id: string) => {
    deleteAccount(id);
  };

  // Use the bestPerformer from our hook
  const bestPerformingAccount = useMemo(() => {
    if (!bestPerformer) return undefined;

    return {
      name: bestPerformer.name,
      changePercentage: bestPerformer.changePercentage,
    };
  }, [bestPerformer]);

  // Handle time period changes from the chart
  const handleTimeRangeChange = (days: number) => {
    setSelectedTimePeriod(days);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header with TestModeToggle */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Argos
            </h1>
            <p className="text-xs text-muted-foreground">
              Your all-seeing financial guardian
            </p>
          </div>
          <TestModeToggle />
        </div>

        <NetWorthSummary
          currentNetWorth={currentNetWorth}
          previousNetWorth={previousNetWorth}
          netWorthChange={netWorthChange}
          changePercentage={changePercentage}
          period={
            selectedTimePeriod === 1
              ? "day"
              : selectedTimePeriod === 7
                ? "week"
                : selectedTimePeriod === 30
                  ? "month"
                  : selectedTimePeriod === 365
                    ? "year"
                    : "all"
          }
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

        <AccountsList
          accounts={accounts}
          onEditAccount={handleEditAccount}
          onDeleteAccount={handleDeleteAccount}
          onAddAccount={handleAddAccount}
        />
      </div>
    </div>
  );
};

export default Index;
