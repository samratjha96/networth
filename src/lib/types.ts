import { Account } from "@/components/AccountsList";

export interface AccountStorage {
  getAccounts(): Promise<Account[]>;
  addAccount(account: Omit<Account, "id">): Promise<Account>;
  updateAccount(account: Account): Promise<void>;
  deleteAccount(id: string): Promise<void>;
}

export interface NetworthHistory {
  date: string;
  value: number;
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
  isTestModeEnabled(): boolean;
  setTestMode(enabled: boolean): void;
}
