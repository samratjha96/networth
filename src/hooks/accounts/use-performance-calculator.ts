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
    // For Supabase mode, just determine the best account based on current data
    // No simulation, no fake performance calculations
    return getBestPerformingAccounts(accounts);
  } else {
    // Only for local mode, use simulated data with deterministic calculation
    return simulateAccountPerformance(accounts);
  }
}

/**
 * For Supabase mode, determine best performing accounts based on current data
 * without simulating any performance metrics
 */
function getBestPerformingAccounts(accounts: Account[]): AccountPerformance[] {
  // Filter accounts by type - assets and liabilities
  const assetAccounts = accounts.filter((account) => !account.isDebt);
  const liabilityAccounts = accounts.filter((account) => account.isDebt);

  // Simple conversion to AccountPerformance format without any fake calculations
  // The true best performer will be selected in the useAccountPerformance hook
  return accounts.map((account) => {
    // For consistency, set the "best" one with highest balance for assets
    // or lowest balance for debts (relative to account type)
    let score = 0;

    if (account.isDebt) {
      // For debts, lower balance is better (less debt)
      const maxDebtBalance = Math.max(
        ...liabilityAccounts.map((a) => Math.abs(a.balance)),
        1,
      );
      score =
        ((maxDebtBalance - Math.abs(account.balance)) / maxDebtBalance) * 100;
    } else {
      // For assets, higher balance is better
      const maxAssetBalance = Math.max(
        ...assetAccounts.map((a) => a.balance),
        1,
      );
      score = (account.balance / maxAssetBalance) * 100;
    }

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currentBalance: account.balance,
      previousBalance: account.balance, // Same balance, no fake previous
      changeAmount: 0, // No fake change
      changePercentage: score, // Use score as percentage for comparison
      isDebt: !!account.isDebt,
    };
  });
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
