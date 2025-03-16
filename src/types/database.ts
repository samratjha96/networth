import { Account } from "./accounts";
import { NetworthHistory } from "./networth";

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

export interface DatabaseProvider extends DatabaseOperations {
  initialize(): Promise<void>;
  close(): Promise<void>;
  synchronizeNetworthHistory(): Promise<void>;
}

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
