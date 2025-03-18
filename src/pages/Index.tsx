import { useEffect } from "react";
import { NetWorthSummary } from "@/components/NetWorthSummary";
import { NetWorthChart } from "@/components/chart/NetWorthChart";
import { AccountsList } from "@/components/AccountsList";
import { CurrencyCode } from "@/types/currency";
import { Header } from "@/components/Header";
import { useAccounts } from "@/hooks/accounts/use-accounts";
import { useAuth } from "@/components/AuthProvider";
import { useDatabaseStore } from "@/store/database-store";
import { useQueryClient } from "@tanstack/react-query";
import { useNetWorthSummary } from "@/hooks/networth/use-networth-summary";

const DEFAULT_CURRENCY: CurrencyCode = "USD";

const Index = () => {
  const { accounts } = useAccounts();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setUserId } = useDatabaseStore();
  const { currentNetWorth, isLoading } = useNetWorthSummary();

  useEffect(() => {
    document.title = "Argos | Your Net Worth Guardian";
  }, []);

  // Set user ID in database store and invalidate queries when user changes
  useEffect(() => {
    // Update database store with user ID
    setUserId(user?.id || null);

    // Invalidate queries to trigger refetch with new user
    queryClient.invalidateQueries({ queryKey: ["networthHistory"] });
    queryClient.invalidateQueries({ queryKey: ["accountPerformance"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  }, [user, queryClient, setUserId]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        <Header />

        <NetWorthSummary />

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
          <NetWorthChart
            currency={DEFAULT_CURRENCY}
            currentNetWorth={currentNetWorth}
            accounts={accounts}
            isLoading={isLoading}
          />
        </div>

        <AccountsList />
      </div>
    </div>
  );
};

export default Index;
