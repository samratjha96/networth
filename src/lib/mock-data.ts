import { Account } from "@/components/AccountsList";
import { NetworthHistory } from "@/lib/types";
import { subDays, addDays, format, parseISO, startOfDay, startOfMonth, isSameDay } from "date-fns";

// Helper to generate a random number between min and max
const randomBetween = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1) + min);

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
    {
      id: "mock-retirement",
      name: "Roth IRA",
      type: "Retirement",
      balance: randomFloat(30000, 80000),
      currency: "USD",
    },
    {
      id: "mock-401k",
      name: "Company 401K",
      type: "401K",
      balance: randomFloat(100000, 300000),
      currency: "USD",
    },
    {
      id: "mock-car",
      name: "2022 Tesla Model 3",
      type: "Car",
      balance: randomFloat(35000, 45000),
      currency: "USD",
    },
    {
      id: "mock-realestate",
      name: "Primary Residence",
      type: "Real Estate",
      balance: randomFloat(400000, 700000),
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
      id: "mock-creditcard2",
      name: "American Express",
      type: "Credit Card",
      balance: -randomFloat(1000, 3000),
      isDebt: true,
      currency: "USD",
    },
    {
      id: "mock-carloan",
      name: "Car Loan",
      type: "Loan",
      balance: -randomFloat(15000, 25000),
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
    {
      id: "mock-studentloan",
      name: "Student Loan",
      type: "Loan",
      balance: -randomFloat(20000, 40000),
      isDebt: true,
      currency: "USD",
    },
  ];
};

// Generate mock net worth history with more pronounced fluctuations
export const generateMockNetworthHistory = (): NetworthHistory[] => {
  const history: NetworthHistory[] = [];
  
  // We'll generate data for the past year to ensure we have enough for all time periods
  const endDate = new Date();
  const startDate = subDays(endDate, 365);
  
  // Calculate initial net worth
  const mockAccounts = generateMockAccounts();
  const initialNetWorth = mockAccounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Start with a value that's significantly lower to show more visible growth
  let currentValue = initialNetWorth * 0.75;
  
  // Define various patterns to create realistic stock-like fluctuations
  
  // 1. Long-term growth trend (annual growth rate)
  // Balance positive and negative growth scenarios with a bias toward positive (70/30)
  const growthScenario = Math.random() > 0.3; // 70% chance of positive growth
  const annualGrowthRate = growthScenario ? 0.12 : -0.15; // Either 12% growth or 15% decline
  const dailyGrowthFactor = Math.pow(1 + annualGrowthRate, 1/365) - 1; // Compound daily rate
  
  // 2. Market volatility patterns - more pronounced for better visualization
  const volatilityFactors = {
    daily: 0.005, // 0.5% daily volatility
    weekly: 0.02, // 2% weekly cycles
    monthly: 0.05, // 5% monthly cycles
    quarterly: 0.1, // 10% quarterly cycles
  };
  
  // 3. Special events (like market crashes, bonuses, large purchases)
  // Randomize whether we include a recent market crash
  const includeRecentCrash = Math.random() > 0.5; // 50% chance
  const specialEvents = [
    { dayOffset: randomBetween(30, 60), type: 'bonus', magnitude: 0.07 },
    { dayOffset: randomBetween(90, 120), type: 'market_dip', magnitude: -0.08 },
    { dayOffset: randomBetween(180, 210), type: 'purchase', magnitude: -0.04 },
    { dayOffset: randomBetween(240, 270), type: 'recovery', magnitude: 0.09 },
    { dayOffset: randomBetween(300, 330), type: 'bonus', magnitude: 0.06 },
  ];
  
  // Conditionally add the recent market crash
  if (includeRecentCrash) {
    specialEvents.push({ 
      dayOffset: 345, 
      type: 'market_crash', 
      magnitude: -0.20 
    });
  }
  
  // 4. Paydays (increase on 1st and 15th of each month)
  const isPayday = (date: Date) => {
    const day = date.getDate();
    return day === 1 || day === 15;
  };
  
  // 5. Bill payments (small decreases at regular intervals)
  const isBillDay = (date: Date) => {
    const day = date.getDate();
    return day === 5 || day === 20; // Common bill payment days
  };
  
  // Generate hourly data points for the last day (to support 1D view)
  const generateHourlyData = (baseDate: Date, baseValue: number) => {
    const hourlyData: NetworthHistory[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const hourDate = new Date(baseDate);
      hourDate.setHours(hour);
      
      // Higher volatility for hourly movements to make them clearly visible
      const hourlyChange = (Math.random() - 0.5) * 0.008; // ±0.4% per hour
      const hourValue = baseValue * (1 + hourlyChange);
      
      hourlyData.push({
        date: hourDate.toISOString(),
        value: Math.round(hourValue * 100) / 100
      });
    }
    
    return hourlyData;
  };
  
  // Generate daily data for the past year
  let previousMonth = -1;
  let monthStart = currentValue;
  let dayOfYear = 0;
  
  for (let day = 0; day <= 365; day++) {
    const date = addDays(startDate, day);
    const month = date.getMonth();
    dayOfYear++;
    
    // Monthly reset for tracking month-to-month changes
    if (month !== previousMonth) {
      previousMonth = month;
      monthStart = currentValue;
    }
    
    // BASE GROWTH: Apply the daily growth factor (long-term trend)
    currentValue *= (1 + dailyGrowthFactor);
    
    // VOLATILITY: Apply daily volatility (random noise)
    const dailyVolatility = (Math.random() - 0.5) * 2 * volatilityFactors.daily;
    currentValue *= (1 + dailyVolatility);
    
    // WEEKLY CYCLES: Weekend effect (dips on Friday, recovers on Monday)
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 5) { // Friday
      currentValue *= (1 - volatilityFactors.weekly * 0.3); // Small dip
    } else if (dayOfWeek === 1) { // Monday
      currentValue *= (1 + volatilityFactors.weekly * 0.3); // Recovery
    }
    
    // MONTHLY PATTERN: Monthly volatility based on day of month
    const dayOfMonth = date.getDate();
    const monthProgress = dayOfMonth / 30; // Approximate month progress
    const monthlyCycle = Math.sin(monthProgress * Math.PI * 2) * volatilityFactors.monthly;
    currentValue *= (1 + monthlyCycle * 0.2); // Reduced effect to avoid too much oscillation
    
    // SPECIAL EVENTS: Apply significant events
    specialEvents.forEach(event => {
      if (day === event.dayOffset) {
        currentValue *= (1 + event.magnitude);
        // Add some aftermath effect
        const aftermath = event.magnitude > 0 ? -0.01 : 0.01; // Small correction after big moves
        currentValue *= (1 + aftermath);
      }
    });
    
    // PAYDAYS: Income on 1st and 15th
    if (isPayday(date)) {
      const paydayBonus = currentValue * 0.01; // 1% increase on paydays
      currentValue += paydayBonus;
    }
    
    // BILL PAYMENTS: Expenses on 5th and 20th
    if (isBillDay(date)) {
      const billPayment = currentValue * 0.005; // 0.5% decrease for bills
      currentValue -= billPayment;
    }
    
    // ENSURE POSITIVE: Make sure value doesn't go too low
    currentValue = Math.max(currentValue, initialNetWorth * 0.6);
    
    // Add daily data point
    history.push({
      date: date.toISOString(),
      value: Math.round(currentValue * 100) / 100
    });
  }
  
  // Apply either an upward or downward trend for the last 30 days
  const applyRecentTrend = (history: NetworthHistory[]): NetworthHistory[] => {
    // Only apply a trend sometimes (50% chance)
    if (Math.random() > 0.5) return history;
    
    // Randomly decide if this is a positive or negative trend (50/50 chance)
    const isPositiveTrend = Math.random() > 0.5;
    
    // Find entries from the last 30 days
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    
    // Apply a gradual trend over the last 30 days
    return history.map(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= thirtyDaysAgo) {
        // Calculate days from 30 days ago (0-30)
        const daysFromStart = Math.floor((entryDate.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
        
        // Progressive change: either positive or negative
        // For positive: +5% at start to +20% at end
        // For negative: -5% at start to -15% at end
        const trendPercentage = isPositiveTrend
          ? 0.05 + (daysFromStart / 30 * 0.15) 
          : -0.05 - (daysFromStart / 30 * 0.1);
        
        // Apply the trend to the original value
        return {
          ...entry,
          value: Math.round(entry.value * (1 + trendPercentage) * 100) / 100
        };
      }
      return entry;
    });
  };
  
  // Special case: For the last 24 hours, add hourly data points for 1D view
  const lastDay = history[history.length - 1];
  const hourlyData = generateHourlyData(new Date(lastDay.date), lastDay.value);
  
  // Combine daily history with hourly data for the last day
  let result = [...history.slice(0, -1), ...hourlyData];
  
  // Apply the recent trend (either positive or negative)
  result = applyRecentTrend(result);
  
  return result;
}; 