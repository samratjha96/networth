import { useState, useEffect, useCallback } from "react";
import { Account } from "@/components/AccountsList";
import { LocalAccountStorage } from "@/lib/account-storage";

const storage = new LocalAccountStorage();

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Load accounts on mount
  useEffect(() => {
    setAccounts(storage.getAccounts());
  }, []);

  const addAccount = useCallback((newAccount: Omit<Account, "id">) => {
    const account = storage.addAccount(newAccount);
    setAccounts((prev) => [...prev, account]);
    return account;
  }, []);

  const updateAccount = useCallback((account: Account) => {
    storage.updateAccount(account);
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? account : a))
    );
  }, []);

  const deleteAccount = useCallback((id: string) => {
    storage.deleteAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}
