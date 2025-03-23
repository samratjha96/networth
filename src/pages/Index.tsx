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
  const currentNetWorth =
    networthHistory[networthHistory.length - 1]?.value || 0;

  useEffect(() => {
    document.title = "Argos | Your Net Worth Guardian";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto py-4 px-3 md:px-4 space-y-4">
        <Header />

        {/* Layout container - vertical on mobile, side-by-side on larger screens */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 md:gap-6 lg:gap-8">
          {/* Left side: Accounts list (at least 1/3 of the screen) */}
          <div className="md:col-span-5 lg:col-span-4 xl:col-span-4 md:pr-2">
            <AccountsList />
          </div>

          {/* Right side: NetWorth components */}
          <div className="md:col-span-7 lg:col-span-8 xl:col-span-8 space-y-4 md:pl-2">
            <NetWorthSummary />

            <NetWorthChart
              currency={DEFAULT_CURRENCY}
              currentNetWorth={currentNetWorth}
              accounts={accounts}
              isLoading={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
