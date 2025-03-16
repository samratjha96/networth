import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "@/hooks/use-database";
import { Account } from "@/types";
import { useAuthStore } from "@/store/auth-store";

export function useAccounts() {
  const { db, databaseMode } = useDatabase();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadAccounts = useCallback(async () => {
    // Only skip loading if auth is still loading AND we're using Supabase
    if (isAuthLoading && databaseMode === "supabase") {
      console.debug("Skipping account load - waiting for auth", {
        isAuthLoading,
        hasUser: !!user,
        mode: databaseMode,
      });
      return;
    }

    try {
      setIsLoading(true);
      console.debug("Loading accounts with mode:", databaseMode);
      const loadedAccounts = await db.getAllAccounts();
      console.debug(`Loaded ${loadedAccounts.length} accounts`);

      setAccounts(loadedAccounts);
      setError(null);
    } catch (err) {
      console.error("Error loading accounts:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to load accounts"),
      );
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [db, databaseMode, isAuthLoading, user]);

  // Load accounts when database mode changes or auth state changes
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts, databaseMode, user]);

  // Function to add a new account
  const addAccount = useCallback(
    async (accountData: Omit<Account, "id">) => {
      try {
        const newAccount = await db.insertAccount(accountData);
        setAccounts((prevAccounts) => [...prevAccounts, newAccount]);
        return newAccount;
      } catch (err) {
        console.error("Error adding account:", err);
        throw err;
      }
    },
    [db],
  );

  // Function to update an account
  const updateAccount = useCallback(
    async (account: Account) => {
      try {
        await db.updateAccount(account);
        setAccounts((prevAccounts) =>
          prevAccounts.map((a) => (a.id === account.id ? account : a)),
        );
      } catch (err) {
        console.error("Error updating account:", err);
        throw err;
      }
    },
    [db],
  );

  // Function to delete an account
  const deleteAccount = useCallback(
    async (id: string) => {
      try {
        await db.deleteAccount(id);
        setAccounts((prevAccounts) => prevAccounts.filter((a) => a.id !== id));
      } catch (err) {
        console.error("Error deleting account:", err);
        throw err;
      }
    },
    [db],
  );

  return {
    accounts,
    isLoading,
    error,
    refreshAccounts: loadAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    refetch: loadAccounts,
  };
}
