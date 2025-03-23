import { useDataSource } from "@/contexts/DataSourceContext";
import { useAccountsStore } from "@/store/accounts-store";
import { useEffect, useRef } from "react";
import { useAccounts as useTanstackAccounts } from "@/api/queries";
import { getMockDataInstance } from "@/lib/mock-data";

export function useAccounts() {
  console.log("[BUG] useAccounts hook called");
  const { dataSource, userId } = useDataSource();
  console.log("[BUG] useAccounts dataSource:", dataSource, "userId:", userId);
  
  // Track previous dataSource to detect changes
  const prevDataSourceRef = useRef(dataSource);

  const {
    accounts,
    isLoading: storeLoading,
    syncRemoteAccounts,
    setDataSourceInfo,
  } = useAccountsStore();

  // Update data source info in the store
  useEffect(() => {
    console.log("[BUG] useAccounts dataSource changed to:", dataSource);
    setDataSourceInfo(dataSource, userId);
    
    // When switching to local, ALWAYS explicitly load mock data
    if (dataSource === "local") {
      console.log("[BUG] Loading mock data because dataSource is local");
      const { accounts: mockAccounts } = getMockDataInstance();
      console.log("[BUG] Mock accounts loaded:", mockAccounts.length);
      syncRemoteAccounts(mockAccounts);
      console.log("[BUG] Mock accounts synced to store");
    }
    
    // Update ref for next check
    prevDataSourceRef.current = dataSource;
  }, [dataSource, userId, setDataSourceInfo, syncRemoteAccounts]);

  // Use Tanstack Query for remote data
  const { data: remoteAccounts, isLoading: queryLoading } = useTanstackAccounts(
    dataSource === "remote" ? userId : null,
  );

  // Sync remote accounts to store
  useEffect(() => {
    if (dataSource === "remote" && remoteAccounts) {
      console.log("[BUG] Syncing remote accounts to store:", remoteAccounts.length);
      syncRemoteAccounts(remoteAccounts);
    }
  }, [dataSource, remoteAccounts, syncRemoteAccounts]);

  // Add debug log to show what accounts are being returned
  console.log("[BUG] useAccounts returning", accounts.length, "accounts");

  return {
    accounts,
    isLoading: queryLoading || storeLoading,
  };
}
