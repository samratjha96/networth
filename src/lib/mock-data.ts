import { AccountWithValue } from "@/types/accounts";
import { NetworthHistory } from "@/types/networth";
import { addDays, subDays } from "date-fns";

// Helper to generate a random float between min and max with 2 decimal places
const randomFloat = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

// Generate 10 mock accounts with random values
export const generateMockAccounts = (): AccountWithValue[] => {
  const accounts: AccountWithValue[] = [
    {
      id: "account-1",
      name: "Primary Checking",
      type: "Checking",
      balance: randomFloat(1500, 5000),
      currency: "USD",
    },
    {
      id: "account-2",
      name: "High-Yield Savings",
      type: "Savings",
      balance: randomFloat(10000, 50000),
      currency: "USD",
    },
    {
      id: "account-3",
      name: "Investment Portfolio",
      type: "Brokerage",
      balance: randomFloat(50000, 200000),
      currency: "USD",
    },
    {
      id: "account-4",
      name: "401(k)",
      type: "Retirement",
      balance: randomFloat(100000, 500000),
      currency: "USD",
    },
    {
      id: "account-5",
      name: "Roth IRA",
      type: "Retirement",
      balance: randomFloat(30000, 80000),
      currency: "USD",
    },
    {
      id: "account-6",
      name: "Credit Card",
      type: "Credit Card",
      balance: -randomFloat(1000, 8000),
      isDebt: true,
      currency: "USD",
    },
    {
      id: "account-7",
      name: "Car Loan",
      type: "Loan",
      balance: -randomFloat(10000, 35000),
      isDebt: true,
      currency: "USD",
    },
    {
      id: "account-8",
      name: "Mortgage",
      type: "Mortgage",
      balance: -randomFloat(200000, 500000),
      isDebt: true,
      currency: "USD",
    },
    {
      id: "account-9",
      name: "Emergency Fund",
      type: "Savings",
      balance: randomFloat(5000, 20000),
      currency: "USD",
    },
    {
      id: "account-10",
      name: "HSA",
      type: "Savings",
      balance: randomFloat(2000, 10000),
      currency: "USD",
    },
  ];

  return accounts;
};

// Calculate total net worth from accounts
export const calculateNetWorth = (accounts: AccountWithValue[]): number => {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
};

// Generate mock net worth history for 365 days
export const generateMockNetworthHistory = (
  accounts: AccountWithValue[],
  days: number = 365
): NetworthHistory[] => {
  const startValue = calculateNetWorth(accounts);
  const today = new Date();
  const history: NetworthHistory[] = [];
  let currentValue = startValue;
  
  // Generate seasonal factors (tax returns, bonuses, etc.)
  const seasonalFactors = new Array(12).fill(0).map(() => randomFloat(-0.03, 0.05));
  
  // Start with initial value
  history.push({
    date: subDays(today, days).toISOString(),
    value: Math.round(startValue * 100) / 100,
  });
  
  for (let i = 1; i <= days; i++) {
    const date = subDays(today, days - i);
    const month = date.getMonth();
    
    // Daily volatility (random changes)
    const volatility = 0.0008;
    const dailyChange = (Math.random() * 2 - 1) * Math.abs(currentValue) * volatility;
    
    // Apply slight upward trend over time
    const trend = 0.0001;
    const trendChange = Math.abs(currentValue) * trend;
    
    // Apply seasonal factors
    const seasonalChange = currentValue * seasonalFactors[month] / 30; // Spread monthly impact across days
    
    // Combine all factors
    currentValue += dailyChange + trendChange + seasonalChange;
    
    // Occasionally add significant events (like large purchases or windfalls)
    if (Math.random() < 0.01) { // 1% chance each day
      const eventImpact = currentValue * (Math.random() > 0.5 ? randomFloat(0.01, 0.05) : -randomFloat(0.01, 0.05));
      currentValue += eventImpact;
    }
    
    history.push({
      date: date.toISOString(),
      value: Math.round(currentValue * 100) / 100,
    });
  }
  
  return history;
};

// Get mock data for the application
export const getMockData = () => {
  const accounts = generateMockAccounts();
  const networthHistory = generateMockNetworthHistory(accounts);
  
  return {
    accounts,
    networthHistory,
  };
};

// Singleton instance of mock data
let mockDataInstance: {
  accounts: AccountWithValue[];
  networthHistory: NetworthHistory[];
} | null = null;

// Get the singleton instance of mock data
export const getMockDataInstance = () => {
  if (!mockDataInstance) {
    mockDataInstance = getMockData();
  }
  return mockDataInstance;
};
