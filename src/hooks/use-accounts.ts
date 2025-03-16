import { useState, useEffect, useCallback } from "react";
import { Account } from "@/types";
import { useDatabase } from "@/lib/database-context";

export function useAccounts() {
  const { db, currentBackend, initialized } = useDatabase();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!initialized) return;

    try {
      setIsLoading(true);
      setAccounts([]); // Clear accounts while loading new ones
      const loadedAccounts = await db.getAllAccounts();
      setAccounts(loadedAccounts);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load accounts"),
      );
      setAccounts([]); // Clear accounts on error
    } finally {
      setIsLoading(false);
    }
  }, [db, initialized]);

  // Load accounts when database is initialized or backend changes
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts, currentBackend, initialized]);

  const addAccount = useCallback(
    async (newAccount: Omit<Account, "id">) => {
      if (!initialized) throw new Error("Database not initialized");

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
    [db, initialized],
  );

  const updateAccount = useCallback(
    async (account: Account) => {
      if (!initialized) throw new Error("Database not initialized");

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
    [db, initialized],
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      if (!initialized) throw new Error("Database not initialized");

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
    [db, initialized],
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
