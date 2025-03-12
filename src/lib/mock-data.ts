import { Account } from "@/components/AccountsList";
import { NetworthHistory } from "@/lib/types";
import { addDays, subDays } from "date-fns";

// Helper to generate a random float between min and max with 2 decimal places
const randomFloat = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

// Generate mock accounts
export const generateMockAccounts = (): Account[] => {
  return [
    // Assets
    {
      id: "mock-checking",
      name: "Primary Checking",
      type: "Checking",
      balance: randomFloat(1500, 5000),
      currency: "USD",
    },
    {
      id: "mock-savings",
      name: "High-Yield Savings",
      type: "Savings",
      balance: randomFloat(10000, 25000),
      currency: "USD",
    },
    {
      id: "mock-brokerage",
      name: "Fidelity Investments",
      type: "Brokerage",
      balance: randomFloat(50000, 150000),
      currency: "USD",
    },
    // Liabilities
    {
      id: "mock-creditcard1",
      name: "Chase Sapphire Card",
      type: "Credit Card",
      balance: -randomFloat(2000, 5000),
      isDebt: true,
      currency: "USD",
    },
    {
      id: "mock-mortgage",
      name: "Home Mortgage",
      type: "Mortgage",
      balance: -randomFloat(250000, 450000),
      isDebt: true,
      currency: "USD",
    },
  ];
};

// Generate mock net worth history with visible fluctuations
export const generateMockNetworthHistory = (): NetworthHistory[] => {
  const mockAccounts = generateMockAccounts();
  const currentNetWorth = mockAccounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );

  const today = new Date();
  const history: NetworthHistory[] = [];

  // Generate yearly data with meaningful trends
  let baseValue = currentNetWorth * 0.7; // Start at 70% of current value
  const dailyPoints = 365;

  // Generate data points with a consistent growth trend and some volatility
  for (let i = 0; i <= dailyPoints; i++) {
    const date = subDays(today, dailyPoints - i);

    // Create a growth trend (30% over the year) with some volatility
    const trendGrowth = (i / dailyPoints) * 0.3; // 30% total growth over the period
    const dailyVolatility = Math.random() * 0.02 - 0.01; // ±1% daily volatility

    // Calculate the value with trend and volatility
    const value = baseValue * (1 + trendGrowth + dailyVolatility);

    // Add the data point
    history.push({
      date: date.toISOString(),
      value: Math.round(value * 100) / 100,
    });
  }

  // Ensure the last point matches current net worth exactly
  history[history.length - 1] = {
    date: today.toISOString(),
    value: currentNetWorth,
  };

  return history;
};
