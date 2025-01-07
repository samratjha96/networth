import { useState, useEffect, useCallback } from "react";
import { Account } from "@/components/AccountsList";
import { DatabaseAccountStorage } from "@/lib/account-storage";

const storage = new DatabaseAccountStorage();

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load accounts on mount
  useEffect(() => {
    async function loadAccounts() {
      try {
        const loadedAccounts = await storage.getAccounts();
        setAccounts(loadedAccounts);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load accounts'));
      } finally {
        setIsLoading(false);
      }
    }
    loadAccounts();
  }, []);

  const addAccount = useCallback(async (newAccount: Omit<Account, "id">) => {
    try {
      const account = await storage.addAccount(newAccount);
      setAccounts((prev) => [...prev, account]);
      setError(null);
      return account;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add account');
      setError(error);
      throw error;
    }
  }, []);

  const updateAccount = useCallback(async (account: Account) => {
    try {
      await storage.updateAccount(account);
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? account : a))
      );
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update account');
      setError(error);
      throw error;
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      await storage.deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete account');
      setError(error);
      throw error;
    }
  }, []);

  return {
    accounts,
    isLoading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}
