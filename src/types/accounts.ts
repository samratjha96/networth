import { CurrencyCode } from "./currency";

// Account Types
export type AssetType =
  | "Checking"
  | "Savings"
  | "Brokerage"
  | "Retirement"
  | "401K"
  | "Car"
  | "Real Estate";

export type DebtType = "Credit Card" | "Loan" | "Mortgage";

export type AccountType = AssetType | DebtType;

// View type for UI components
export type AccountViewType = "assets" | "liabilities";

// Common type collections for reuse
export const assetTypes: AssetType[] = [
  "Checking",
  "Savings",
  "Brokerage",
  "Retirement",
  "401K",
  "Car",
  "Real Estate",
];

export const debtTypes: DebtType[] = ["Credit Card", "Loan", "Mortgage"];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  isDebt?: boolean;
  currency: CurrencyCode;
}

// Extended account with its current value
export interface AccountWithValue extends Account {
  balance: number;
}
