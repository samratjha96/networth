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
  isDebt?: boolean;
  currency: CurrencyCode;
}

// Historical account value record
export interface AccountValue {
  accountId: string;
  hourStart: Date;
  value: number;
}

// Extended account with its current value
export interface AccountWithValue extends Account {
  balance: number;
}

export interface AccountStorage {
  getAccounts(): Promise<AccountWithValue[]>;
  addAccount(account: Omit<AccountWithValue, "id">): Promise<AccountWithValue>;
  updateAccount(account: AccountWithValue): Promise<void>;
  deleteAccount(id: string): Promise<void>;

  // New methods for historical data
  getAccountValueHistory(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AccountValue[]>;
  getAccountValue(accountId: string): Promise<number>;
}
