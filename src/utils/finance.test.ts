import { describe, expect, it } from "vitest";
import {
  calculateAccountTotals,
  calculatePercentageChange,
  findValueAsOf,
} from "./finance";
import { AccountWithValue } from "@/types/accounts";

describe("calculateAccountTotals", () => {
  it("nets out a portfolio with several debts of differing magnitude, not just one", () => {
    // Regression for a bug where liabilities were summed via
    // `.reduce((sum, a) => Math.abs(sum + a.balance), 0)` — taking the
    // absolute value on every iteration instead of once at the end, which
    // silently under-reported liabilities whenever a user had 2+ debts.
    const accounts: AccountWithValue[] = [
      {
        id: "1",
        name: "Checking",
        type: "Checking",
        currency: "USD",
        isDebt: false,
        balance: 5000,
      },
      {
        id: "2",
        name: "Savings",
        type: "Savings",
        currency: "USD",
        isDebt: false,
        balance: 10000,
      },
      {
        id: "3",
        name: "Credit Card",
        type: "Credit Card",
        currency: "USD",
        isDebt: true,
        balance: -2000,
      },
      {
        id: "4",
        name: "Car Loan",
        type: "Loan",
        currency: "USD",
        isDebt: true,
        balance: -15000,
      },
    ];

    const totals = calculateAccountTotals(accounts);

    expect(totals.totalAssets).toBe(15000);
    expect(totals.totalLiabilities).toBe(17000);
    expect(totals.netWorth).toBe(-2000);
  });
});

describe("findValueAsOf + calculatePercentageChange", () => {
  it("compares current net worth against the last known value projected forward from an irregular history, not a stale or zeroed baseline", () => {
    // Regression for the original bug report: selecting "1M" showed a 0.0%
    // delta because the "previous value" lookup picked the earliest record
    // *within* the range instead of the last known value as of the start of
    // the range. History here has no entry exactly on the cutoff date, so
    // this also guards the "closest value on/before cutoff" scan direction.
    const history = [
      { date: "2026-06-01T00:00:00.000Z", value: 100000 },
      { date: "2026-06-15T00:00:00.000Z", value: 102000 },
      { date: "2026-07-10T00:00:00.000Z", value: 108000 },
      { date: "2026-07-20T00:00:00.000Z", value: 110000 },
      { date: "2026-08-05T00:00:00.000Z", value: 115000 },
    ];
    const currentValue = 120000;
    const oneMonthAgo = new Date("2026-07-27T12:00:00.000Z");

    const previous = findValueAsOf(history, oneMonthAgo);
    expect(previous?.value).toBe(110000);

    const percentageChange = calculatePercentageChange(
      currentValue,
      previous!.value,
    );

    expect(percentageChange).toBeCloseTo(9.0909, 3);
  });
});
