import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "@/hooks/use-database";
import { Account } from "@/types";
import { useAuth } from "@/components/AuthProvider";

export function useAccounts() {
  const { db, currentBackend } = useDatabase();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadAccounts = useCallback(async () => {
    // Only skip loading if auth is still loading AND we're using Supabase
    // If we're in local mode, we should still load accounts even without a user
    if (isAuthLoading && currentBackend === "supabase") {
      console.debug("Skipping account load - waiting for auth", {
        isAuthLoading,
        hasUser: !!user,
        backend: currentBackend,
      });
      return;
    }

    // Also skip if we expect a user (Supabase mode) but don't have one yet
    if (!user && currentBackend === "supabase") {
      console.debug("Skipping account load - no user in Supabase mode");
      setAccounts([]); // Reset accounts when signed out
      return;
    }

    try {
      setIsLoading(true);
      console.debug("Loading accounts with backend:", currentBackend);
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
  }, [db, currentBackend, user, isAuthLoading]);

  // Load accounts when database backend changes or auth state changes
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts, currentBackend, user]);

  const addAccount = useCallback(
    async (newAccount: Omit<Account, "id">) => {
      try {
        const account = await db.insertAccount(newAccount);
        await loadAccounts();
        return account;
      } catch (err) {
        console.error("Error adding account:", err);
        const error =
          err instanceof Error ? err : new Error("Failed to add account");
        setError(error);
        throw error;
      }
    },
    [db, loadAccounts],
  );

  const updateAccount = useCallback(
    async (account: Account) => {
      try {
        await db.updateAccount(account);
        await loadAccounts();
      } catch (err) {
        console.error("Error updating account:", err);
        const error =
          err instanceof Error ? err : new Error("Failed to update account");
        setError(error);
        throw error;
      }
    },
    [db, loadAccounts],
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      try {
        await db.deleteAccount(id);
        await loadAccounts();
      } catch (err) {
        console.error("Error deleting account:", err);
        const error =
          err instanceof Error ? err : new Error("Failed to delete account");
        setError(error);
        throw error;
      }
    },
    [db, loadAccounts],
  );

  return {
    accounts,
    isLoading: isLoading || (isAuthLoading && currentBackend === "supabase"),
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    refetch: loadAccounts,
  };
}
