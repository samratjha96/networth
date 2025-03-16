import { Account } from "@/types/accounts";
import { AccountPerformance } from "@/types/performance";
import { DatabaseProvider } from "@/types/database";

/**
 * Calculate performance metrics for a set of accounts
 */
export async function calculateAccountPerformance(
  accounts: Account[],
  days: number,
  db: DatabaseProvider,
): Promise<AccountPerformance[]> {
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

    // Add some randomness while keeping direction consistent with account type
    const randomFactor = Math.random() * 2 - 0.5; // -0.5 to 1.5
    const adjustedRate = baseRate + randomFactor;

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
