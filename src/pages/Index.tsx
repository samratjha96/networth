import { useState, useMemo, useEffect } from "react";
import { NetWorthSummary } from "@/components/NetWorthSummary";
import { NetWorthChart } from "@/components/NetWorthChart";
import { AccountsList, Account, CurrencyCode } from "@/components/AccountsList";
import { AddAccountDialog } from "@/components/AddAccountDialog";

const DEFAULT_CURRENCY: CurrencyCode = "USD";

const generateDailyData = (accounts: Account[], days: number) => {
  const data = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Generate daily fluctuations for each account
    const dailyValues = accounts.map((account) => {
      const baseValue = account.balance;
      const randomFluctuation = (Math.random() - 0.5) * 0.02; // ±1% daily fluctuation
      return baseValue * (1 + randomFluctuation);
    });

    const totalValue = dailyValues.reduce((sum, value) => sum + value, 0);

    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: totalValue,
    });
  }
  return data;
};

const findBestPerformingAccount = (accounts: Account[]) => {
  if (accounts.length === 0) return undefined;

  const accountPerformances = accounts.map((account) => {
    const randomGrowth = 5 + Math.random() * 15; // 5-20% growth
    return {
      name: account.name,
      changePercentage: randomGrowth,
    };
  });

  return accountPerformances.reduce((prev, current) =>
    prev.changePercentage > current.changePercentage ? prev : current,
  );
};

const Index = () => {
  useEffect(() => {
    document.title = "Argos | Your Net Worth Guardian";
  }, []);

  const [accounts, setAccounts] = useState<Account[]>([]);

  const chartData = useMemo(() => generateDailyData(accounts, 365), [accounts]);

  const handleAddAccount = (newAccount: Omit<Account, "id">) => {
    setAccounts([
      ...accounts,
      {
        ...newAccount,
        id: Math.random().toString(36).substr(2, 9),
      },
    ]);
  };

  const handleEditAccount = (account: Account) => {
    console.log("Edit account:", account);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter((account) => account.id !== id));
  };

  const calculateNetWorth = () => {
    return accounts.reduce((sum, account) => {
      const value = account.balance;
      // TODO: Add currency conversion here when needed
      return sum + (account.isDebt ? -value : value);
    }, 0);
  };

  const currentNetWorth = calculateNetWorth();
  const previousNetWorth = currentNetWorth * 0.95;
  const changePercentage =
    ((currentNetWorth - previousNetWorth) / previousNetWorth) * 100 || 0;
  const bestPerformingAccount = findBestPerformingAccount(accounts);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-10 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Argos
            </h1>
            <p className="text-sm text-muted-foreground">
              Your all-seeing financial guardian
            </p>
          </div>
          <AddAccountDialog onAddAccount={handleAddAccount} />
        </div>

        <div className="grid gap-6">
          <div className="p-6 rounded-xl bg-card border border-border/50">
            <NetWorthSummary
              currentNetWorth={currentNetWorth}
              previousNetWorth={previousNetWorth}
              changePercentage={changePercentage}
              period="month"
              currency={DEFAULT_CURRENCY}
              bestPerformingAccount={bestPerformingAccount}
            />
          </div>

          {accounts.length > 0 && (
            <div className="p-6 rounded-xl bg-card border border-border/50">
              <NetWorthChart data={chartData} hasAccounts={true} currency={DEFAULT_CURRENCY} />
            </div>
          )}
        </div>

        <div className="grid gap-6">
          <div className="rounded-xl bg-card border border-border/50">
            <AccountsList
              accounts={accounts}
              onEditAccount={handleEditAccount}
              onDeleteAccount={handleDeleteAccount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
