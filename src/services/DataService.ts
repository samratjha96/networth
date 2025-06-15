import { AccountWithValue } from "@/types/accounts";
import { NetworthHistory, TimeRange } from "@/types/networth";

/**
 * DataService interface defines all data operations for the application
 * to abstract the implementation details (mock vs real API)
 */
export interface DataService {
  // Account operations
  getAccounts(): Promise<AccountWithValue[]>;
  addAccount(account: Omit<AccountWithValue, "id">): Promise<AccountWithValue>;
  updateAccount(account: AccountWithValue): Promise<void>;
  deleteAccount(id: string): Promise<void>;

  // Net worth operations
  getNetWorthHistory(timeRange: TimeRange): Promise<NetworthHistory[]>;
  getLatestNetWorth(timeRange: TimeRange): Promise<{
    currentValue: number;
    previousValue: number;
    change: number;
    percentageChange: number;
  } | null>;

  // Account performance operations
  getAccountPerformance(timeRange: TimeRange): Promise<
    | {
        account_id: string;
        account_name: string;
        percent_change: number;
        amount_change: number;
      }[]
    | null
  >;
}
