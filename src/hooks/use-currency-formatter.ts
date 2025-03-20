import { formatCurrency } from "@/lib/utils";
import { CurrencyCode, CURRENCY_SYMBOLS } from "@/types/currency";

interface FormattingOptions {
  showSign?: boolean;
  preserveDecimals?: boolean;
  compact?: boolean;
}

export const useCurrencyFormatter = (currency: CurrencyCode) => {
  const formatWithCurrency = (
    value: number,
    options: FormattingOptions = {},
  ) => {
    const {
      showSign = false,
      preserveDecimals = false,
      compact = false,
    } = options;

    const symbol = CURRENCY_SYMBOLS[currency];
    let formatted = formatCurrency(Math.abs(value), { compact });

    // Replace the default $ with the appropriate currency symbol
    formatted = formatted.replace(/^\$/, "");

    // Handle negative values
    const prefix = value < 0 ? "-" : showSign && value > 0 ? "+" : "";

    return `${prefix}${symbol}${formatted}`;
  };

  return {
    formatWithCurrency,
    currencySymbol: CURRENCY_SYMBOLS[currency],
  };
};
