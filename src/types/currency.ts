export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD";

// Currency data with symbols and names for UI display
export const CURRENCIES = [
  { code: "USD" as CurrencyCode, symbol: "$", name: "US Dollar" },
  { code: "EUR" as CurrencyCode, symbol: "€", name: "Euro" },
  { code: "GBP" as CurrencyCode, symbol: "£", name: "British Pound" },
  { code: "JPY" as CurrencyCode, symbol: "¥", name: "Japanese Yen" },
  { code: "CAD" as CurrencyCode, symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD" as CurrencyCode, symbol: "A$", name: "Australian Dollar" },
] as const;

// Currency symbols for formatting display
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};
