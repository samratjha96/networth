import { AccountWithValue } from "@/types/accounts";

/**
 * Percentage change from previous to current. When previous is 0, a swing to
 * a non-zero current value is reported as +/-100% rather than 0%, since 0%
 * would incorrectly read as "no change".
 */
export function calculatePercentageChange(
  current: number,
  previous: number,
): number {
  if (previous === 0) {
    if (current > 0) return 100;
    if (current < 0) return -100;
    return 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export interface AccountTotals {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

/**
 * Sums account balances into assets/liabilities/net worth. Debt account
 * balances are stored negative, so liabilities are summed first and then
 * made positive as a whole (not per-account) to avoid cancelling out debts
 * of differing magnitudes.
 */
export function calculateAccountTotals(
  accounts: AccountWithValue[],
): AccountTotals {
  const totalAssets = accounts
    .filter((account) => !account.isDebt)
    .reduce((sum, account) => sum + account.balance, 0);

  const totalLiabilities = Math.abs(
    accounts
      .filter((account) => account.isDebt)
      .reduce((sum, account) => sum + account.balance, 0),
  );

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}

/**
 * Account totals never convert between currencies — they just sum raw
 * balances. Returns true when accounts span more than one currency, so
 * callers can warn that totals may be misleading.
 */
export function hasMixedCurrencies(accounts: AccountWithValue[]): boolean {
  return new Set(accounts.map((account) => account.currency)).size > 1;
}

/**
 * Finds the most recent entry on or before `cutoff` from a chronologically
 * ascending (oldest-first) list, i.e. the value that would have been current
 * as of `cutoff`.
 */
export function findValueAsOf<T extends { date: string }>(
  ascendingHistory: T[],
  cutoff: Date,
): T | null {
  for (let i = ascendingHistory.length - 1; i >= 0; i--) {
    if (new Date(ascendingHistory[i].date) <= cutoff) {
      return ascendingHistory[i];
    }
  }
  return null;
}
