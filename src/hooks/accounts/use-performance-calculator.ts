import { Account } from "@/types/accounts";
import { AccountPerformance } from "@/types/performance";
import { DatabaseProvider } from "@/types/database";
import { SupabaseDatabase } from "@/lib/supabase-database";

/**
 * Calculate performance metrics for a set of accounts
 */
export async function calculateAccountPerformance(
  accounts: Account[],
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
  accounts: Account[],
  days: number,
  db: SupabaseDatabase,
): Promise<AccountPerformance[]> {
  console.debug(
    "Using real historical account data for performance calculation",
    { accounts: accounts.length, days },
  );

  // Get user ID for queries
  const userId = (db as any).getUserId();
  console.debug("Using user ID for performance queries:", userId);

  // Date range for historical data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  console.debug("Date range for performance calculation:", {
    startDate,
    endDate,
  });

  const performanceResults: AccountPerformance[] = [];

  // Process each account to determine performance
  for (const account of accounts) {
    try {
      console.debug(`Processing account ${account.name} (${account.type})`);

      // Get historical data for this account
      const historyData = await db.getAccountHistoricalData(account, days);

      if (!historyData) {
        console.debug(
          `No historical data available for ${account.name}, using current data`,
        );
        performanceResults.push({
          id: account.id,
          name: account.name,
          type: account.type,
          currentBalance: account.balance,
          previousBalance: account.balance,
          changeAmount: 0,
          changePercentage: 0,
          isDebt: !!account.isDebt,
        });
        continue;
      }

      console.debug(`Account history data for ${account.name}:`, historyData);

      // Calculate performance metrics
      const { currentBalance, previousBalance } = historyData;
      const changeAmount = currentBalance - previousBalance;
      const changePercentage =
        previousBalance !== 0
          ? (changeAmount / Math.abs(previousBalance)) * 100
          : 0;

      console.debug(`Performance metrics for ${account.name}:`, {
        currentBalance,
        previousBalance,
        changeAmount,
        changePercentage,
        currentDate: historyData.currentDate,
        previousDate: historyData.previousDate,
      });

      performanceResults.push({
        id: account.id,
        name: account.name,
        type: account.type,
        currentBalance,
        previousBalance,
        changeAmount,
        changePercentage,
        isDebt: !!account.isDebt,
      });
    } catch (error) {
      console.error(`Error processing account ${account.name}:`, error);
      // Add a default entry for this account
      performanceResults.push({
        id: account.id,
        name: account.name,
        type: account.type,
        currentBalance: account.balance,
        previousBalance: account.balance,
        changeAmount: 0,
        changePercentage: 0,
        isDebt: !!account.isDebt,
      });
    }
  }

  console.debug("Completed performance calculation:", {
    results: performanceResults.length,
  });
  return performanceResults;
}

/**
 * Simulates account performance (local mode only)
 */
function simulateAccountPerformance(accounts: Account[]): AccountPerformance[] {
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
