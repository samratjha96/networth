import { Account } from "@/components/AccountsList";

export interface AccountStorage {
  getAccounts(): Account[];
  addAccount(account: Omit<Account, "id">): Account;
  updateAccount(account: Account): void;
  deleteAccount(id: string): void;
}
