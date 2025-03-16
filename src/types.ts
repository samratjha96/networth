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

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  isDebt?: boolean;
  currency: CurrencyCode;
}

// Account Performance
export interface AccountPerformance {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  previousBalance: number;
  changeAmount: number;
  changePercentage: number;
  isDebt: boolean;
}

export interface PerformanceData {
  bestPerformer: AccountPerformance | null;
  worstPerformer: AccountPerformance | null;
  isLoading: boolean;
  error: Error | null;
}

// Net Worth Types
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

export type TimeRange = 1 | 7 | 30 | 365 | 0; // 0 represents "ALL"

// Database Interfaces
export interface AccountStorage {
  getAccounts(): Promise<Account[]>;
  addAccount(account: Omit<Account, "id">): Promise<Account>;
  updateAccount(account: Account): Promise<void>;
  deleteAccount(id: string): Promise<void>;
}

export interface DatabaseOperations {
  // Account operations
  getAllAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  insertAccount(accountData: Omit<Account, "id">): Promise<Account>;
  updateAccount(account: Account): Promise<void>;
  deleteAccount(id: string): Promise<void>;

  // Networth history operations
  getNetworthHistory(days: number): Promise<NetworthHistory[]>;
  addNetworthSnapshot(value: number): Promise<void>;
}

// Interface that real database implementations must follow
export interface DatabaseProvider extends DatabaseOperations {
  initialize(): Promise<void>;
  close(): Promise<void>;
  synchronizeNetworthHistory(): Promise<void>;
}

// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number;
          created_at: string;
          currency: string;
          id: string;
          is_debt: boolean | null;
          name: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance: number;
          created_at?: string;
          currency?: string;
          id?: string;
          is_debt?: boolean | null;
          name: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          is_debt?: boolean | null;
          name?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      networth_history: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          user_id: string;
          value: number;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          user_id: string;
          value: number;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          user_id?: string;
          value?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

// Database provider for compatibility with older code
export interface DatabaseProviderAdapter {
  // Database methods
  initialize: () => Promise<void>;
  addAccount: (account: Account) => Promise<Account>;
  getAccounts: () => Promise<Account[]>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getNetworthHistory: (days?: number) => Promise<NetworthHistory[]>;
  addNetworthSnapshot: (value: number) => Promise<void>;
  synchronizeNetworthHistory: () => Promise<void>;
}

// Database state for Zustand store
export interface DatabaseState {
  // State
  currentBackend: "local" | "supabase";
  db: DatabaseProvider;

  // Actions
  setBackend: (backend: "local" | "supabase") => Promise<void>;
  refreshDatabase: () => Promise<void>;

  // Authentication-related helpers
  switchToSupabase: () => Promise<void>;
  switchToLocal: () => Promise<void>;
}
