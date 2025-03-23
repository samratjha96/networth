import { useDataSource } from "@/contexts/DataSourceContext";
import { useAccountsStore } from "@/store/accounts-store";
import { useEffect } from "react";
import { useAccounts as useTanstackAccounts } from "@/api/queries";

export function useAccounts() {
  const { dataSource, userId } = useDataSource();

  // Get accounts and actions from store
  const {
    accounts,
    isLoading: storeLoading,
    syncRemoteAccounts,
    setDataSourceInfo,
  } = useAccountsStore();

  // Update data source info in the store whenever it changes in the context
  useEffect(() => {
    setDataSourceInfo(dataSource, userId);
  }, [dataSource, userId, setDataSourceInfo]);

  // Using Tanstack Query for remote data
  const { data: remoteAccounts, isLoading: queryLoading } = useTanstackAccounts(
    dataSource === "remote" ? userId : null,
  );

  // Sync remote accounts to store when data changes
  useEffect(() => {
    if (dataSource === "remote" && remoteAccounts) {
      syncRemoteAccounts(remoteAccounts);
    }
  }, [dataSource, remoteAccounts, syncRemoteAccounts]);

  // Combined loading state
  const isLoading = queryLoading || storeLoading;

  // Return accounts from the store and loading state
  return { accounts, isLoading };
}
