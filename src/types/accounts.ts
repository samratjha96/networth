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
  balance: number;
  isDebt?: boolean;
  currency: CurrencyCode;
}

export interface AccountStorage {
  getAccounts(): Promise<Account[]>;
  addAccount(account: Omit<Account, "id">): Promise<Account>;
  updateAccount(account: Account): Promise<void>;
  deleteAccount(id: string): Promise<void>;
}
