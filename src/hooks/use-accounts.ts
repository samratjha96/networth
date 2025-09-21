import { useDataSource } from "@/contexts/DataSourceContext";
import { useAccountsStore } from "@/store/accounts-store";
import { useEffect } from "react";
import { usePocketBaseAccounts as useTanstackAccounts } from "@/api/pocketbase-queries";
import { getMockDataInstance } from "@/lib/mock-data";

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

    // Always load mock data when in local mode
    if (dataSource === "local") {
      const { accounts: mockAccounts } = getMockDataInstance();
      syncRemoteAccounts(mockAccounts);
    }
  }, [dataSource, userId, setDataSourceInfo, syncRemoteAccounts]);

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
