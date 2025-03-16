export type TimeRange = 1 | 7 | 30 | 365 | 0; // 0 represents "ALL"

export interface NetWorthDataPoint {
  date: string;
  value: number;
  // Optional metadata to explain significant changes
  metadata?: {
    changePercentage?: number;
    changeAmount?: number;
    isSignificant?: boolean;
  };
}

export interface NetworthHistory {
  date: string;
  value: number;
}

export interface NetWorthEvent {
  date: string;
  value: number;
  description?: string;
  type?:
    | "deposit"
    | "withdrawal"
    | "market_change"
    | "account_added"
    | "account_removed";
  accountId?: string;
}
