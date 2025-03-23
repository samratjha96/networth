import { useDataSource } from "@/contexts/DataSourceContext";
import { useAccountsStore } from "@/store/accounts-store";
import { useEffect } from "react";
import { useAccounts as useTanstackAccounts } from "@/api/queries";

export function useAccounts() {
  const { dataSource, userId } = useDataSource();
  const {
    accounts,
    isLoading: storeLoading,
    syncRemoteAccounts,
    setDataSourceInfo,
  } = useAccountsStore();

  // Update data source info in the store
  useEffect(() => {
    setDataSourceInfo(dataSource, userId);
  }, [dataSource, userId, setDataSourceInfo]);

  // Use Tanstack Query for remote data
  const { data: remoteAccounts, isLoading: queryLoading } = useTanstackAccounts(
    dataSource === "remote" ? userId : null,
  );

  // Sync remote accounts to store
  useEffect(() => {
    if (dataSource === "remote" && remoteAccounts) {
      syncRemoteAccounts(remoteAccounts);
    }
  }, [dataSource, remoteAccounts, syncRemoteAccounts]);

  return {
    accounts,
    isLoading: queryLoading || storeLoading,
  };
}
