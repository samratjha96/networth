import { AccountWithValue } from "@/types/accounts";
import { NetworthHistory } from "@/types/networth";
import { subDays, subHours, formatISO, startOfHour } from "date-fns";

// Configuration for mock data generation
export interface MockAccountConfig {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  currency?: string;
  isDebt?: boolean;
  // Growth pattern configuration
  growthPattern?: {
    type: "steady" | "volatile" | "trending_up" | "trending_down" | "seasonal";
    volatility?: number; // 0-1, how much the value fluctuates
    trend?: number; // Daily percentage change tendency
    minValue?: number; // Floor value
    maxValue?: number; // Ceiling value
  };
}

// Default account configurations
export const DEFAULT_MOCK_ACCOUNTS_CONFIG: MockAccountConfig[] = [
  {
    id: "account-1",
    name: "Primary Checking",
    type: "Checking",
    initialBalance: 3500,
    currency: "USD",
    growthPattern: {
      type: "steady",
      volatility: 0.05,
      minValue: 1000,
      maxValue: 10000,
    },
  },
  {
    id: "account-2",
    name: "High-Yield Savings",
    type: "Savings",
    initialBalance: 35000,
    currency: "USD",
    growthPattern: {
      type: "trending_up",
      volatility: 0.02,
      trend: 0.0008, // ~0.08% daily growth
      minValue: 0,
    },
  },
  {
    id: "account-3",
    name: "Investment Portfolio",
    type: "Brokerage",
    initialBalance: 125000,
    currency: "USD",
    growthPattern: {
      type: "volatile",
      volatility: 0.15, // High volatility
      trend: 0.001, // Slight upward trend
      minValue: 50000,
    },
  },
  {
    id: "account-4",
    name: "401(k)",
    type: "Retirement",
    initialBalance: 300000,
    currency: "USD",
    growthPattern: {
      type: "trending_up",
      volatility: 0.08,
      trend: 0.0012, // Strong upward trend
      minValue: 0,
    },
  },
  {
    id: "account-5",
    name: "Roth IRA",
    type: "Retirement",
    initialBalance: 55000,
    currency: "USD",
    growthPattern: {
      type: "trending_up",
      volatility: 0.07,
      trend: 0.001,
      minValue: 0,
    },
  },
  {
    id: "account-6",
    name: "Credit Card",
    type: "Credit Card",
    initialBalance: -4500,
    currency: "USD",
    isDebt: true,
    growthPattern: {
      type: "steady",
      volatility: 0.1,
      maxValue: 0,
      minValue: -10000,
    },
  },
  {
    id: "account-7",
    name: "Car Loan",
    type: "Loan",
    initialBalance: -25000,
    currency: "USD",
    isDebt: true,
    growthPattern: {
      type: "trending_down", // Paying down debt
      volatility: 0.02,
      trend: -0.002, // Decreasing debt over time
      maxValue: 0,
      minValue: -35000,
    },
  },
  {
    id: "account-8",
    name: "Mortgage",
    type: "Mortgage",
    initialBalance: -350000,
    currency: "USD",
    isDebt: true,
    growthPattern: {
      type: "trending_down",
      volatility: 0.01,
      trend: -0.0005, // Slow debt reduction
      maxValue: 0,
      minValue: -500000,
    },
  },
  {
    id: "account-9",
    name: "Emergency Fund",
    type: "Savings",
    initialBalance: 12000,
    currency: "USD",
    growthPattern: {
      type: "steady",
      volatility: 0.03,
      trend: 0.0005,
      minValue: 5000,
    },
  },
  {
    id: "account-10",
    name: "HSA",
    type: "Savings",
    initialBalance: 6000,
    currency: "USD",
    growthPattern: {
      type: "trending_up",
      volatility: 0.05,
      trend: 0.0008,
      minValue: 0,
    },
  },
];

// Helper to generate a random float between min and max with 2 decimal places
const randomFloat = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

// Generate hourly account value based on pattern
const generateNextHourValue = (
  currentValue: number,
  config: MockAccountConfig,
  hourIndex: number,
): number => {
  const pattern = config.growthPattern || {
    type: "steady",
    volatility: 0.05,
  };

  const volatility = pattern.volatility || 0.05;
  const trend = pattern.trend || 0;
  const minValue = pattern.minValue ?? (config.isDebt ? -Infinity : 0);
  const maxValue = pattern.maxValue ?? Infinity;

  let newValue = currentValue;

  // Apply trend
  newValue += Math.abs(currentValue) * trend;

  // Apply volatility based on pattern type
  switch (pattern.type) {
    case "volatile":
      newValue +=
        (Math.random() * 2 - 1) * Math.abs(currentValue) * volatility * 2;
      break;
    case "trending_up":
      newValue +=
        Math.abs(currentValue) *
        (trend + (Math.random() * volatility - volatility / 2));
      break;
    case "trending_down":
      newValue +=
        Math.abs(currentValue) *
        (trend + (Math.random() * volatility - volatility / 2));
      break;
    case "seasonal": {
      // Seasonal pattern with monthly variations
      const month = new Date(
        Date.now() - hourIndex * 60 * 60 * 1000,
      ).getMonth();
      const seasonalFactor = Math.sin((month / 12) * Math.PI * 2) * 0.02;
      newValue +=
        Math.abs(currentValue) *
        (trend +
          seasonalFactor +
          (Math.random() * volatility - volatility / 2));
      break;
    }
    case "steady":
    default:
      newValue +=
        (Math.random() * 2 - 1) * Math.abs(currentValue) * volatility * 0.5;
      break;
  }

  // Apply constraints
  newValue = Math.max(minValue, Math.min(maxValue, newValue));

  return Math.round(newValue * 100) / 100;
};

// Generate hourly account values for a period
export const generateAccountHistory = (
  config: MockAccountConfig,
  startDate: Date,
  endDate: Date,
): Array<{ date: string; value: number }> => {
  const history: Array<{ date: string; value: number }> = [];
  let currentValue = config.initialBalance;
  let currentTime = new Date(startDate);

  // Start from a bit before the start date to ensure we have data
  const hoursBeforeStart = 24; // 24 hours before
  currentTime = subHours(currentTime, hoursBeforeStart);

  // Generate initial value that will lead to the initial balance at startDate
  // This creates a realistic starting point
  for (let i = 0; i < hoursBeforeStart; i++) {
    currentValue = generateNextHourValue(currentValue, config, i);
    currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
  }

  // Reset to initial balance at start date (with some variation)
  currentValue =
    config.initialBalance +
    randomFloat(-config.initialBalance * 0.1, config.initialBalance * 0.1);
  currentTime = new Date(startDate);

  // Generate hourly values from start to end
  const hoursDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000),
  );

  for (let i = 0; i <= hoursDiff; i++) {
    const hourStart = startOfHour(currentTime);

    history.push({
      date: formatISO(hourStart),
      value: currentValue,
    });

    // Generate next hour's value
    currentValue = generateNextHourValue(currentValue, config, i);
    currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
  }

  return history;
};

// Generate accounts from configuration
export const generateMockAccounts = (
  configs: MockAccountConfig[] = DEFAULT_MOCK_ACCOUNTS_CONFIG,
): AccountWithValue[] => {
  const now = new Date();

  return configs.map((config) => {
    // Generate history backwards from now to get realistic current balance
    // Start from 365 days ago with initialBalance, generate forward to now
    const startDate = subDays(now, 365);
    const recentHistory = generateAccountHistory(config, startDate, now);

    // Current balance is the latest value (which should be close to initialBalance after 365 days of growth)
    const currentBalance =
      recentHistory[recentHistory.length - 1]?.value || config.initialBalance;

    return {
      id: config.id,
      name: config.name,
      type: config.type as AccountWithValue["type"],
      balance: Math.round(currentBalance * 100) / 100,
      currency: (config.currency || "USD") as AccountWithValue["currency"],
      isDebt: config.isDebt || false,
    };
  });
};

// Calculate total net worth from accounts
export const calculateNetWorth = (accounts: AccountWithValue[]): number => {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
};

// Generate mock net worth history for specified days
export const generateMockNetworthHistory = (
  accounts: AccountWithValue[],
  days: number = 365,
): NetworthHistory[] => {
  const today = new Date();
  const startDate = subDays(today, days);
  const history: NetworthHistory[] = [];

  // Generate hourly values and aggregate to daily
  const accountConfigs = DEFAULT_MOCK_ACCOUNTS_CONFIG;

  // Get all hourly account histories
  const accountHistories = accounts.map((account) => {
    const config = accountConfigs.find((c) => c.id === account.id);
    if (!config) {
      // Fallback for accounts not in config
      return generateAccountHistory(
        {
          id: account.id,
          name: account.name,
          type: account.type,
          initialBalance: account.balance,
          currency: account.currency,
          isDebt: account.isDebt,
          growthPattern: { type: "steady", volatility: 0.05 },
        },
        startDate,
        today,
      );
    }

    // Generate history with correct initial balance
    const accountHistory = generateAccountHistory(config, startDate, today);
    return accountHistory;
  });

  // Aggregate hourly values to daily net worth
  const hourlyNetWorth: Map<string, number> = new Map();

  // Process each hour
  const allHours = new Set<string>();
  accountHistories.forEach((history) => {
    history.forEach((point) => {
      allHours.add(point.date);
    });
  });

  const sortedHours = Array.from(allHours).sort();

  sortedHours.forEach((hour) => {
    let netWorth = 0;
    accountHistories.forEach((history) => {
      // Find the closest value to this hour (or use previous)
      let value = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].date <= hour) {
          value = history[i].value;
          break;
        }
      }
      netWorth += value;
    });
    hourlyNetWorth.set(hour, netWorth);
  });

  // Convert to daily net worth (take one value per day, at end of day)
  const dailyNetWorth: Map<string, number> = new Map();
  const processedDays = new Set<string>();

  sortedHours.forEach((hour) => {
    const date = new Date(hour);
    const dayKey = date.toISOString().split("T")[0];

    if (!processedDays.has(dayKey)) {
      // Find the last hour of this day
      const dayHours = sortedHours.filter((h) => h.startsWith(dayKey));
      if (dayHours.length > 0) {
        const lastHourOfDay = dayHours[dayHours.length - 1];
        const netWorth = hourlyNetWorth.get(lastHourOfDay) || 0;
        dailyNetWorth.set(dayKey, netWorth);
        processedDays.add(dayKey);
      }
    }
  });

  // Convert to NetworthHistory array
  Array.from(dailyNetWorth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, value]) => {
      history.push({
        date: `${date}T00:00:00.000Z`,
        value: Math.round(value * 100) / 100,
      });
    });

  return history;
};

// Store account histories for MockDataService
let accountHistoriesCache: Map<
  string,
  Array<{ date: string; value: number }>
> | null = null;

// Generate and cache account histories
export const generateAllAccountHistories = (
  accounts: AccountWithValue[],
  maxDays: number = 365,
): Map<string, Array<{ date: string; value: number }>> => {
  if (accountHistoriesCache) {
    return accountHistoriesCache;
  }

  const cache = new Map<string, Array<{ date: string; value: number }>>();
  const today = new Date();
  const startDate = subDays(today, maxDays);
  const accountConfigs = DEFAULT_MOCK_ACCOUNTS_CONFIG;

  accounts.forEach((account) => {
    const config = accountConfigs.find((c) => c.id === account.id);
    if (config) {
      // Use config's initialBalance and generate history from startDate to today
      // The history will naturally evolve to the account's current balance
      const history = generateAccountHistory(config, startDate, today);
      cache.set(account.id, history);
    } else {
      // Fallback for accounts not in config - use account's current balance as starting point
      // and generate backwards to create history
      const fallbackConfig: MockAccountConfig = {
        id: account.id,
        name: account.name,
        type: account.type,
        initialBalance: account.balance,
        currency: account.currency,
        isDebt: account.isDebt,
        growthPattern: { type: "steady", volatility: 0.05 },
      };
      const history = generateAccountHistory(fallbackConfig, startDate, today);
      cache.set(account.id, history);
    }
  });

  accountHistoriesCache = cache;
  return cache;
};

// Get mock data for the application
export const getMockData = () => {
  const accounts = generateMockAccounts();
  const networthHistory = generateMockNetworthHistory(accounts);

  // Generate and cache account histories
  generateAllAccountHistories(accounts);

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
