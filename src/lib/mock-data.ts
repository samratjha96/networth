import { Account } from "@/types/accounts";
import { NetworthHistory } from "@/types/networth";
import { addDays, subDays } from "date-fns";

// Helper to generate a random float between min and max with 2 decimal places
const randomFloat = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

// Generate mock accounts
export const generateMockAccounts = (): Account[] => {
  // Randomly decide what kind of financial situation to simulate
  const financialProfile = Math.floor(Math.random() * 4); // 0-3 different profiles

  // Base accounts that will be included in all profiles
  const accounts: Account[] = [
    {
      id: "mock-checking",
      name: "Primary Checking",
      type: "Checking",
      balance: randomFloat(1500, 5000),
      currency: "USD",
    },
    {
      id: "mock-creditcard1",
      name: "Chase Sapphire Card",
      type: "Credit Card",
      balance: -randomFloat(1000, 6000),
      isDebt: true,
      currency: "USD",
    },
  ];

  // Profile 0: High net worth investor
  if (financialProfile === 0) {
    accounts.push(
      {
        id: "mock-savings",
        name: "High-Yield Savings",
        type: "Savings",
        balance: randomFloat(30000, 100000),
        currency: "USD",
      },
      {
        id: "mock-brokerage",
        name: "Investment Portfolio",
        type: "Brokerage",
        balance: randomFloat(100000, 500000),
        currency: "USD",
      },
      {
        id: "mock-retirement",
        name: "401(k)",
        type: "Retirement",
        balance: randomFloat(200000, 800000),
        currency: "USD",
      },
      {
        id: "mock-mortgage",
        name: "Home Mortgage",
        type: "Mortgage",
        balance: -randomFloat(300000, 700000),
        isDebt: true,
        currency: "USD",
      },
    );
  }
  // Profile 1: Young professional with student loans
  else if (financialProfile === 1) {
    accounts.push(
      {
        id: "mock-savings",
        name: "Emergency Fund",
        type: "Savings",
        balance: randomFloat(5000, 20000),
        currency: "USD",
      },
      {
        id: "mock-brokerage",
        name: "Robinhood Investments",
        type: "Brokerage",
        balance: randomFloat(10000, 30000),
        currency: "USD",
      },
      {
        id: "mock-studentloan",
        name: "Student Loans",
        type: "Loan",
        balance: -randomFloat(20000, 100000),
        isDebt: true,
        currency: "USD",
      },
    );
  }
  // Profile 2: Debt-heavy with negative net worth
  else if (financialProfile === 2) {
    accounts.push(
      {
        id: "mock-savings",
        name: "Savings Account",
        type: "Savings",
        balance: randomFloat(500, 5000),
        currency: "USD",
      },
      {
        id: "mock-creditcard2",
        name: "Citi Double Cash",
        type: "Credit Card",
        balance: -randomFloat(5000, 15000),
        isDebt: true,
        currency: "USD",
      },
      {
        id: "mock-carloan",
        name: "Auto Loan",
        type: "Loan",
        balance: -randomFloat(15000, 40000),
        isDebt: true,
        currency: "USD",
      },
      {
        id: "mock-personalloan",
        name: "Personal Loan",
        type: "Loan",
        balance: -randomFloat(10000, 30000),
        isDebt: true,
        currency: "USD",
      },
    );
  }
  // Profile 3: Balanced portfolio
  else {
    accounts.push(
      {
        id: "mock-savings",
        name: "High-Yield Savings",
        type: "Savings",
        balance: randomFloat(10000, 40000),
        currency: "USD",
      },
      {
        id: "mock-brokerage",
        name: "Vanguard ETFs",
        type: "Brokerage",
        balance: randomFloat(30000, 80000),
        currency: "USD",
      },
      {
        id: "mock-mortgage",
        name: "Home Mortgage",
        type: "Mortgage",
        balance: -randomFloat(150000, 350000),
        isDebt: true,
        currency: "USD",
      },
    );
  }

  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  console.log("[DEBUG] Generated accounts with total balance:", totalBalance);
  return accounts;
};

// Generate monthly seasonal factors (like tax returns, bonuses, etc)
const generateSeasonalFactors = (isNegative: boolean) => {
  const factors = new Array(12).fill(0);

  // Tax return/bonus season (March-April)
  factors[2] = isNegative ? -0.05 : 0.05; // Significant tax return impact
  factors[3] = isNegative ? -0.02 : 0.02; // Trailing tax return effect

  // Summer spending (June-August)
  factors[5] = isNegative ? 0.02 : -0.02; // Summer spending starts
  factors[6] = isNegative ? 0.03 : -0.03; // Peak summer spending
  factors[7] = isNegative ? 0.02 : -0.02; // Summer spending trails off

  // Year-end bonuses/holiday spending (November-December)
  factors[10] = isNegative ? -0.04 : 0.04; // Year-end bonus
  factors[11] = isNegative ? 0.05 : -0.05; // Holiday spending

  return factors;
};

const generateDailyChange = (
  baseValue: number,
  volatility: number = 0.0005,
) => {
  const maxChange = Math.abs(baseValue) * volatility;
  return (Math.random() * 2 - 1) * maxChange;
};

const generateTrendChange = (baseValue: number, trend: number) => {
  // Increase base trend impact
  return Math.abs(baseValue) * trend * 2;
};

export const generateMockNetworthHistory = (
  startValue: number,
  trend: number = 0.00008,
  days: number = 365,
  volatility: number = 0.0005,
): NetworthHistory[] => {
  if (startValue === undefined || isNaN(startValue)) {
    console.error(
      "Invalid startValue in generateMockNetworthHistory:",
      startValue,
    );
    return [];
  }

  console.log(
    `[HISTORY] Generating history with startValue: ${startValue}, trend: ${trend}`,
  );

  const today = new Date();
  const history: NetworthHistory[] = [];
  let currentValue = startValue;

  const isNegative = startValue < 0;
  const seasonalFactors = generateSeasonalFactors(isNegative);
  // Slightly increase max daily change
  const maxDailyChange = Math.abs(startValue) * 0.008;

  // Start with the initial value
  history.push({
    date: subDays(today, days).toISOString(),
    value: Math.round(startValue * 100) / 100,
  });

  let lastMonthValue = currentValue;
  let lastMonth = subDays(today, days).getMonth();

  for (let i = 1; i <= days; i++) {
    const date = subDays(today, days - i);
    const month = date.getMonth();

    // Handle month transition
    if (month !== lastMonth) {
      lastMonthValue = currentValue;
      lastMonth = month;
    }

    // Base trend with increased impact
    const baseTrend = generateTrendChange(currentValue, Math.abs(trend));
    const trendChange = isNegative ? baseTrend : -baseTrend;

    // Calculate seasonal effect with smoother progression
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    const monthProgress = date.getDate() / daysInMonth;
    const seasonalFactor = seasonalFactors[month];
    const seasonalChange =
      (lastMonthValue * seasonalFactor * monthProgress) / 20; // Increased impact

    // Daily volatility
    const dailyChange = generateDailyChange(currentValue, volatility);

    // Combine changes with weighted importance
    const totalDailyChange =
      trendChange * 1.5 + seasonalChange * 2 + dailyChange;
    const proposedValue = currentValue + totalDailyChange;

    // Calculate percentage change for logging
    const percentChange =
      ((proposedValue - currentValue) / Math.abs(currentValue)) * 100;

    // Log significant changes
    if (Math.abs(percentChange) > 2) {
      console.log(`[HISTORY] Date: ${date.toISOString()}`);
      console.log(`  Current: ${currentValue.toFixed(2)}`);
      console.log(`  Proposed: ${proposedValue.toFixed(2)}`);
      console.log(`  Change: ${percentChange.toFixed(2)}%`);
      console.log(
        `  Components: trend=${trendChange.toFixed(2)}, seasonal=${seasonalChange.toFixed(2)}, daily=${dailyChange.toFixed(2)}`,
      );
    }

    // Apply change with limit
    if (Math.abs(proposedValue - currentValue) > maxDailyChange) {
      const sign = Math.sign(proposedValue - currentValue);
      const limitedChange = sign * maxDailyChange;
      currentValue += limitedChange;
    } else {
      currentValue = proposedValue;
    }

    // Log month transitions
    if (i > 1 && date.getDate() === 1) {
      const monthlyChange =
        ((currentValue - lastMonthValue) / Math.abs(lastMonthValue)) * 100;
      console.log(
        `[HISTORY] Month transition to ${date.toLocaleString("default", { month: "long" })}`,
      );
      console.log(`  Seasonal factor: ${seasonalFactor}`);
      console.log(`  Current value: ${currentValue.toFixed(2)}`);
      console.log(`  Monthly change: ${monthlyChange.toFixed(2)}%`);
    }

    history.push({
      date: date.toISOString(),
      value: Math.round(currentValue * 100) / 100,
    });
  }

  const totalChange =
    ((currentValue - startValue) / Math.abs(startValue)) * 100;
  console.log(`[HISTORY] Generation complete:`);
  console.log(`  Start value: ${startValue.toFixed(2)}`);
  console.log(`  End value: ${currentValue.toFixed(2)}`);
  console.log(`  Total change: ${totalChange.toFixed(2)}%`);

  return history;
};

// Example usage with actual account balances:
export const generatePositiveTrendData = () => {
  const accounts = generateMockAccounts();
  const startValue = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  if (startValue === undefined || isNaN(startValue)) {
    console.error("Invalid startValue calculated:", startValue);
    return [];
  }
  const trend = startValue < 0 ? -0.00008 : 0.00008;
  return generateMockNetworthHistory(startValue, trend);
};

export const generateNegativeTrendData = () => {
  const accounts = generateMockAccounts();
  const startValue = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  if (startValue === undefined || isNaN(startValue)) {
    console.error("Invalid startValue calculated:", startValue);
    return [];
  }
  const trend = startValue < 0 ? 0.00006 : -0.00006;
  return generateMockNetworthHistory(startValue, trend);
};

export const generateSevereNegativeTrendData = () => {
  const accounts = generateMockAccounts();
  const startValue = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  if (startValue === undefined || isNaN(startValue)) {
    console.error("Invalid startValue calculated:", startValue);
    return [];
  }
  const trend = startValue < 0 ? 0.0001 : -0.0001;
  return generateMockNetworthHistory(startValue, trend);
};
