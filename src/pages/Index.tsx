import { useMemo, useEffect } from "react";
import { useAccounts } from "@/hooks/use-accounts";
import { useNetworthHistory } from "@/hooks/use-networth-history";
import { NetWorthSummary } from "@/components/NetWorthSummary";
import { NetWorthChart } from "@/components/NetWorthChart";
import { AccountsList, Account, CurrencyCode } from "@/components/AccountsList";
import { AddAccountDialog } from "@/components/AddAccountDialog";

const DEFAULT_CURRENCY: CurrencyCode = "USD";

const findBestPerformingAccount = (accounts: Account[]) => {
  if (accounts.length === 0) return undefined;

  // Only consider asset accounts (not debts)
  const assetAccounts = accounts.filter((account) => !account.isDebt);
  if (assetAccounts.length === 0) return undefined;

  const accountPerformances = assetAccounts.map((account) => {
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

  const { accounts, addAccount, updateAccount, deleteAccount } = useAccounts();

  const handleAddAccount = (newAccount: Omit<Account, "id">) => {
    addAccount(newAccount);
  };

  const handleEditAccount = (account: Account) => {
    updateAccount(account);
  };

  const handleDeleteAccount = (id: string) => {
    deleteAccount(id);
  };

  const calculateNetWorth = () => {
    return accounts.reduce((sum, account) => {
      return sum + account.balance;
    }, 0);
  };

  const currentNetWorth = calculateNetWorth();

  // Get last month's net worth from history
  const { data: networthHistory = [] } = useNetworthHistory(30); // Get last 30 days of history

  // Get the oldest entry from last month (if available)
  const previousNetWorth =
    networthHistory.length > 0 ? networthHistory[0].value : currentNetWorth;

  // Calculate net worth change
  const netWorthChange = currentNetWorth - previousNetWorth;

  // Calculate change percentage (0 if there's no previous data)
  const changePercentage =
    previousNetWorth !== currentNetWorth
      ? ((currentNetWorth - previousNetWorth) / Math.abs(previousNetWorth)) *
        100
      : 0;

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
              <NetWorthChart
                hasAccounts={true}
                currency={DEFAULT_CURRENCY}
                currentNetWorth={currentNetWorth}
              />
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
