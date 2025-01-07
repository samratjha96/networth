import { useState } from "react";
import { NetWorthSummary } from "@/components/NetWorthSummary";
import { NetWorthChart } from "@/components/NetWorthChart";
import { AccountsList, Account } from "@/components/AccountsList";
import { AddAccountDialog } from "@/components/AddAccountDialog";

const generateMockData = () => {
  const data = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: 50000 + Math.random() * 10000,
    });
  }
  return data;
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
    // To be implemented
    console.log('Edit account:', account);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter((account) => account.id !== id));
  };

  const currentNetWorth = accounts.reduce((sum, account) => sum + account.balance, 0);
  const previousNetWorth = currentNetWorth * 0.95; // Mock previous value
  const changePercentage = ((currentNetWorth - previousNetWorth) / previousNetWorth) * 100;

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