import { useMemo, useEffect, useState } from "react";
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
  
  useEffect(() => {
    document.title = "Argos | Your Net Worth Guardian";
    
    // Synchronize the networth history with current account data on initial load
    db.synchronizeNetworthHistory();
  }, []);

  const { accounts, addAccount, updateAccount, deleteAccount } = useAccounts();
  
  // Get account performance data
  const { bestPerformer, isLoading: isPerformanceLoading } = useAccountPerformance(accounts, 'month');

  // Calculate current net worth from accounts (source of truth)
  const currentNetWorth = useMemo(() => 
    accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );
  
  // Calculate asset and liability totals for verification
  const assetsTotal = useMemo(() => 
    accounts.filter(account => !account.isDebt).reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );
  
  const liabilitiesTotal = useMemo(() => 
    accounts.filter(account => account.isDebt).reduce((sum, account) => sum + Math.abs(account.balance), 0),
    [accounts]
  );
  
  // Verify net worth calculation matches assets minus liabilities
  useEffect(() => {
    const calculatedNetWorth = assetsTotal - liabilitiesTotal;
    const discrepancy = Math.abs(calculatedNetWorth - currentNetWorth);
    
    if (discrepancy > 0.01) { // Allow for tiny floating point differences
      console.warn('Net worth calculation discrepancy detected:', {
        fromAccounts: currentNetWorth,
        fromAssetLiabilityCalc: calculatedNetWorth,
        assets: assetsTotal,
        liabilities: liabilitiesTotal,
        discrepancy
      });
    }
  }, [currentNetWorth, assetsTotal, liabilitiesTotal]);

  // Get networth history data using the selected time period
  const { data: networthHistory = [] } = useNetworthHistory(selectedTimePeriod, accounts);
  
  // When accounts change, update the networth snapshot
  useEffect(() => {
    // Only update if we have accounts
    if (accounts.length > 0) {
      // Ensure the current net worth is reflected in history
      db.addNetworthSnapshot(currentNetWorth);
    }
  }, [accounts, currentNetWorth]);
  
  // Find the oldest entry in our history (from the selected time period)
  const previousNetWorth = useMemo(() => {
    if (networthHistory.length <= 1) return currentNetWorth;
    
    // Sort by date to find the oldest entry
    const sorted = [...networthHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return sorted[0]?.value || currentNetWorth;
  }, [networthHistory, currentNetWorth]);
  
  // Calculate change amount and percentage based on history data
  const netWorthChange = currentNetWorth - previousNetWorth;
  const changePercentage = previousNetWorth !== 0
    ? (netWorthChange / Math.abs(previousNetWorth)) * 100
    : 0;

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
            <p className="text-xs text-muted-foreground">Your all-seeing financial guardian</p>
          </div>
          <TestModeToggle />
        </div>

        <NetWorthSummary
          currentNetWorth={currentNetWorth}
          previousNetWorth={previousNetWorth}
          changePercentage={changePercentage}
          period={selectedTimePeriod === 1 ? "day" : selectedTimePeriod === 7 ? "week" : selectedTimePeriod === 30 ? "month" : "year"}
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
