import { AccountWithValue } from "@/types/accounts";
import { AccountPerformance } from "@/types/performance";
import { DatabaseProvider } from "@/types/database";
import { SupabaseDatabase } from "@/lib/supabase-database";
import { Functions } from "@/types/supabase";

/**
 * Calculate performance metrics for a set of accounts
 */
export async function calculateAccountPerformance(
  accounts: AccountWithValue[],
  days: number,
  db: DatabaseProvider,
): Promise<AccountPerformance[]> {
  // Check if we're using Supabase
  const isSupabase = db instanceof SupabaseDatabase;

  if (isSupabase) {
    // For Supabase mode, use real historical account data
    return getAccountPerformanceFromHistory(
      accounts,
      days,
      db as SupabaseDatabase,
    );
  } else {
    // Only for local mode, use simulated data with deterministic calculation
    return simulateAccountPerformance(accounts);
  }
}

/**
 * For Supabase mode, use real historical account data to calculate performance
 */
async function getAccountPerformanceFromHistory(
  accounts: AccountWithValue[],
  days: number,
  db: SupabaseDatabase,
): Promise<AccountPerformance[]> {
  console.debug(
    "Using real historical account data for performance calculation",
    { accounts: accounts.length, days },
  );

  // Date range for historical data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  console.debug("Date range for performance calculation:", {
    startDate,
    endDate,
  });

  try {
    // Use the new getAccountsPerformanceData method that works with our hourly_account_values table
    const performanceData = await (
      db as SupabaseDatabase
    ).getAccountsPerformanceData(accounts, days);

    console.debug("Received performance data from database:", {
      results: performanceData.length,
    });

    // Map results to the expected AccountPerformance format
    return performanceData.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      currentBalance: item.currentBalance,
      previousBalance: item.previousBalance,
      changeAmount: item.changeAmount,
      changePercentage: item.changePercentage,
      isDebt: item.isDebt,
    }));
  } catch (error) {
    console.error("Error getting performance data:", error);

    // Fallback to using current data with zero change
    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currentBalance: account.balance,
      previousBalance: account.balance,
      changeAmount: 0,
      changePercentage: 0,
      isDebt: !!account.isDebt,
    }));
  }
}

/**
 * Simulates account performance (local mode only)
 */
function simulateAccountPerformance(
  accounts: AccountWithValue[],
): AccountPerformance[] {
  // Growth rates for realistic account simulations by account type
  const growthRates: Record<string, number> = {
    "Real Estate": 5.0,
    Brokerage: 4.2,
    "401K": 3.8,
    Retirement: 3.5,
    Savings: 2.5,
    Checking: 0.5,
    Car: -1.2,
    "Credit Card": -0.5,
    Loan: 0.3,
    Mortgage: 0.2,
  };

  // Create performance data for all accounts
  return accounts.map((account) => {
    // Get base growth rate for this account type or use default
    const baseRate = growthRates[account.type] || (account.isDebt ? -0.5 : 2.0);

    // Use a deterministic adjustment factor based on account ID
    const hash = account.id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const deterministicFactor = ((hash % 100) / 100) * 1.5 - 0.25; // Range from -0.25 to 1.25
    const adjustedRate = baseRate + deterministicFactor;

    // Calculate simulated previous balance based on growth rate
    const previousBalance = account.isDebt
      ? account.balance / (1 - adjustedRate / 100)
      : account.balance / (1 + adjustedRate / 100);

    const changeAmount = account.balance - previousBalance;
    const changePercentage =
      previousBalance !== 0
        ? (changeAmount / Math.abs(previousBalance)) * 100
        : 0;

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currentBalance: account.balance,
      previousBalance,
      changeAmount,
      changePercentage,
      isDebt: !!account.isDebt,
    };
  });
}
