import { AccountWithValue } from "@/types/accounts";
import { useAccountsStore } from "@/store/accounts-store";
import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/components/DatabaseProvider";

interface UseAccountsResult {
  accounts: AccountWithValue[];
  assetsAccounts: AccountWithValue[];
  liabilitiesAccounts: AccountWithValue[];
  isLoading: boolean;
  error: Error | null;
  addAccount: (
    account: Omit<AccountWithValue, "id">,
  ) => Promise<AccountWithValue>;
  updateAccount: (account: AccountWithValue) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export function useAccounts(): UseAccountsResult {
  const { addAccount, updateAccount, deleteAccount } = useAccountsStore();
  const { db, backendType } = useDb();

  async function fetchAccounts(): Promise<AccountWithValue[]> {
    try {
      console.log("Fetching accounts from database:", backendType);
      const accounts = await db.getAllAccounts();
      console.log(
        `Fetched ${accounts.length} accounts from ${backendType} backend`,
      );
      useAccountsStore.setState({ accounts });
      return accounts;
    } catch (error) {
      console.error("Failed to load accounts:", error);
      return [];
    }
  }

  const query = useQuery<AccountWithValue[]>({
    queryKey: ["accounts", backendType, db],
    queryFn: fetchAccounts,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: 10000,
  });

  const accounts = query.data ?? [];
  const assetsAccounts = accounts.filter((account) => !account.isDebt);
  const liabilitiesAccounts = accounts.filter((account) => account.isDebt);

  return {
    accounts,
    assetsAccounts,
    liabilitiesAccounts,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}
