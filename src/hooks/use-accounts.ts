import { useState, useEffect, useCallback } from "react";
import { Account } from "@/types";
import { useDatabase } from "@/lib/database-context";

export function useAccounts() {
  const { db } = useDatabase();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const loadedAccounts = await db.getAllAccounts();
      setAccounts(loadedAccounts);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load accounts"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addAccount = useCallback(
    async (newAccount: Omit<Account, "id">) => {
      try {
        const account = await db.insertAccount(newAccount);
        setAccounts((prev) => [...prev, account]);
        setError(null);
        return account;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to add account");
        setError(error);
        throw error;
      }
    },
    [db],
  );

  const updateAccount = useCallback(
    async (account: Account) => {
      try {
        await db.updateAccount(account);
        setAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? account : a)),
        );
        setError(null);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update account");
        setError(error);
        throw error;
      }
    },
    [db],
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      try {
        await db.deleteAccount(id);
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setError(null);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to delete account");
        setError(error);
        throw error;
      }
    },
    [db],
  );

  return {
    accounts,
    isLoading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}
