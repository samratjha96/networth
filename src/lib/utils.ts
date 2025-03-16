import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AccountType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export const accountTypeEmojis: Record<AccountType, string> = {
  // Assets
  Checking: "🏦",
  Savings: "💰",
  Brokerage: "📈",
  Retirement: "👴",
  "401K": "🏢",
  Car: "🚗",
  "Real Estate": "🏠",

  // Liabilities
  "Credit Card": "💳",
  Loan: "💵",
  Mortgage: "🏡",
};

export type AccountColorScheme = {
  textColor: string;
  borderColor: string;
  backgroundColor?: string;
};

export function getAccountColor(
  type: AccountType,
  isDebt?: boolean,
  balance?: number,
): AccountColorScheme {
  // Check for negative balances in asset accounts
  if (balance !== undefined && balance < 0 && !isDebt) {
    return {
      textColor: "text-red-500",
      borderColor: "border-red-500/80",
    };
  }

  // Group accounts by type
  if (isDebt) {
    switch (type) {
      case "Credit Card":
        return {
          textColor: "text-orange-500",
          borderColor: "border-orange-500/80",
        };
      case "Loan":
        return {
          textColor: "text-amber-500",
          borderColor: "border-amber-500/80",
        };
      case "Mortgage":
        return {
          textColor: "text-red-600",
          borderColor: "border-red-600/80",
        };
      default:
        return {
          textColor: "text-orange-500",
          borderColor: "border-orange-500/80",
        };
    }
  } else {
    // Asset accounts
    switch (type) {
      case "Checking":
      case "Savings":
        return {
          textColor: "text-green-500",
          borderColor: "border-green-500/80",
        };
      case "Brokerage":
      case "Retirement":
      case "401K":
        return {
          textColor: "text-blue-500",
          borderColor: "border-blue-500/80",
        };
      case "Car":
        return {
          textColor: "text-indigo-500",
          borderColor: "border-indigo-500/80",
        };
      case "Real Estate":
        return {
          textColor: "text-purple-500",
          borderColor: "border-purple-500/80",
        };
      default:
        return {
          textColor: "text-green-500",
          borderColor: "border-green-500/80",
        };
    }
  }
}
