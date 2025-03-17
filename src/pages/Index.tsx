import { useMemo, useEffect } from "react";
import { useNetworthHistory } from "@/hooks/networth/use-networth-history";
import { useAccountPerformance } from "@/hooks/accounts/use-account-performance";
import { NetWorthSummary } from "@/components/NetWorthSummary";
import { NetWorthChart } from "@/components/chart/NetWorthChart";
import { AccountsList } from "@/components/AccountsList";
import { CurrencyCode } from "@/types/currency";
import { TimeRange } from "@/types/networth";
import { Header } from "@/components/Header";
import { useTimeRange } from "@/hooks/networth/use-time-range";
import { useAccounts } from "@/hooks/accounts/use-accounts";

const DEFAULT_CURRENCY: CurrencyCode = "USD";

const Index = () => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useTimeRange();
  const { accounts, isLoading: accountsLoading } = useAccounts();

  useEffect(() => {
    document.title = "Argos | Your Net Worth Guardian";
  }, []);

  // Get account performance data
  const { bestPerformer, isLoading: performanceLoading } =
    useAccountPerformance(accounts, "month");

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
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
  }, [accounts]);

  const { currentNetWorth } = financialMetrics;

  // Fetch the net worth history
  const { data: networthHistory, isLoading: historyLoading } =
    useNetworthHistory(selectedTimePeriod);

  // Calculate changes over the time period
  const changes = useMemo(() => {
    // Find the previous net worth from the history
    const previousNetWorth =
      networthHistory?.length > 1 ? networthHistory[0].value : currentNetWorth;

    const netWorthChange = currentNetWorth - previousNetWorth;
    const changePercentage = previousNetWorth
      ? (netWorthChange / Math.abs(previousNetWorth)) * 100
      : 0;

    return {
      previousNetWorth,
      netWorthChange,
      changePercentage,
    };
  }, [networthHistory, currentNetWorth]);

  // Handle time period changes from the chart
  const handleTimeRangeChange = (days: number) => {
    setSelectedTimePeriod(days as TimeRange);
  };

  // Check if still loading data
  const isLoading = accountsLoading || performanceLoading || historyLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        <Header />

        <NetWorthSummary
          currentNetWorth={currentNetWorth}
          netWorthChange={changes.netWorthChange}
          changePercentage={changes.changePercentage}
          currency={DEFAULT_CURRENCY}
          bestPerformingAccount={bestPerformer}
          isLoading={isLoading}
        />

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
          <NetWorthChart
            currency={DEFAULT_CURRENCY}
            currentNetWorth={currentNetWorth}
            onTimeRangeChange={handleTimeRangeChange}
            initialTimeRange={selectedTimePeriod}
            accounts={accounts}
          />
        </div>

        <AccountsList />
      </div>
    </div>
  );
};

export default Index;
