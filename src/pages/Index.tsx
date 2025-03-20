import { useEffect } from "react";
import { NetWorthSummary } from "@/components/NetWorthSummary";
import { NetWorthChart } from "@/components/chart/NetWorthChart";
import { AccountsList } from "@/components/AccountsList";
import { CurrencyCode } from "@/types/currency";
import { Header } from "@/components/Header";
import { useAccountsStore } from "@/store/accounts-store";
import { getMockDataInstance } from "@/lib/mock-data";

const DEFAULT_CURRENCY: CurrencyCode = "USD";

const Index = () => {
  const { accounts } = useAccountsStore();
  const { networthHistory } = getMockDataInstance();
  const currentNetWorth = networthHistory[networthHistory.length - 1]?.value || 0;

  useEffect(() => {
    document.title = "Argos | Your Net Worth Guardian";
  }, []);

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
            isLoading={false}
          />
        </div>

        <AccountsList />
      </div>
    </div>
  );
};

export default Index;
