import { useState } from "react";
import { NetWorthSummary } from "@/components/NetWorthSummary";
import { NetWorthChart } from "@/components/NetWorthChart";
import { AccountsList, Account } from "@/components/AccountsList";
import { AddAccountDialog } from "@/components/AddAccountDialog";

const generateMockData = () => {
  const data = [];
  const today = new Date();
  for (let i = 365; i >= 0; i--) { // Generate a year's worth of data
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: 50000 + Math.random() * 10000,
    });
  }
  return data;
};

const findBestPerformingAccount = (accounts: Account[]) => {
  if (accounts.length === 0) return undefined;
  
  // In a real app, you'd calculate this based on historical data
  // For now, we'll use a simple mock calculation
  const bestAccount = accounts.reduce((prev, current) => {
    const prevGrowth = Math.random() * 20; // Mock growth rate
    const currentGrowth = Math.random() * 20;
    return prevGrowth > currentGrowth ? prev : current;
  });

  return {
    name: bestAccount.name,
    changePercentage: Math.random() * 20, // Mock growth rate
  };
};

const Index = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const chartData = generateMockData();

  const handleAddAccount = (newAccount: Omit<Account, 'id'>) => {
    setAccounts([
      ...accounts,
      {
        ...newAccount,
        id: Math.random().toString(36).substr(2, 9),
      },
    ]);
  };

  const handleEditAccount = (account: Account) => {
    console.log('Edit account:', account);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter((account) => account.id !== id));
  };

  const currentNetWorth = accounts.reduce((sum, account) => sum + account.balance, 0);
  const previousNetWorth = currentNetWorth * 0.95; // Mock previous value
  const changePercentage = ((currentNetWorth - previousNetWorth) / previousNetWorth) * 100;
  const bestPerformingAccount = findBestPerformingAccount(accounts);

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Net Worth Tracker</h1>
        <AddAccountDialog onAddAccount={handleAddAccount} />
      </div>
      
      <div className="grid gap-6">
        <NetWorthSummary
          currentNetWorth={currentNetWorth}
          previousNetWorth={previousNetWorth}
          changePercentage={changePercentage}
          period="month"
          bestPerformingAccount={bestPerformingAccount}
        />
        <NetWorthChart data={chartData} />
      </div>

      <div className="grid gap-6">
        <AccountsList
          accounts={accounts}
          onEditAccount={handleEditAccount}
          onDeleteAccount={handleDeleteAccount}
        />
      </div>
    </div>
  );
};

export default Index;