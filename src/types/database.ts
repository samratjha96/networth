import { AccountValue, AccountWithValue } from "./accounts";
import { NetworthHistory } from "./networth";

export interface DatabaseOperations {
  // Account operations
  getAllAccounts(): Promise<AccountWithValue[]>;
  getAccount(id: string): Promise<AccountWithValue | undefined>;
  insertAccount(
    accountData: Omit<AccountWithValue, "id">,
  ): Promise<AccountWithValue>;
  updateAccount(account: AccountWithValue): Promise<void>;
  deleteAccount(id: string): Promise<void>;

  // Account value operations
  getAccountValue(accountId: string): Promise<number>;
  getAccountValueHistory(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AccountValue[]>;

  // Networth history operations
  getNetworthHistory(days: number): Promise<NetworthHistory[]>;
  addNetworthSnapshot(value: number): Promise<void>;
}

export interface DatabaseProvider extends DatabaseOperations {
  initialize(): Promise<void>;
  close(): Promise<void>;
  synchronizeNetworthHistory(): Promise<void>;
  cleanup?(): void;
}

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
