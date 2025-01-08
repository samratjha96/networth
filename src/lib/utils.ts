import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AccountType } from "@/components/AccountsList";

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
  "Checking": "🏦",
  "Savings": "💰",
  "Brokerage": "📈",
  "Retirement": "👴",
  "401K": "🏢",
  "Car": "🚗",
  "Real Estate": "🏠",

  // Liabilities
  "Credit Card": "💳",
  "Loan": "💵",
  "Mortgage": "🏡",
};
