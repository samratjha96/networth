import { useEffect } from "react";
import { useDataSource } from "@/contexts/DataSourceContext";
import { useAuthStore } from "@/store/auth-store";
import { useAccountsStore } from "@/store/accounts-store";

export const DebugContext = () => {
  const { dataSource, userId } = useDataSource();
  const user = useAuthStore(state => state.user);
  const status = useAuthStore(state => state.status);
  const accounts = useAccountsStore(state => state.accounts);
  const accountsDataSource = useAccountsStore(state => state.dataSource);
  
  // Log all info
  useEffect(() => {
    console.log("[BUG] DebugContext rendered with new values", {
      dataSource,
      userId,
      authStatus: status,
      authUserId: user?.id || 'null',
      accountsCount: accounts.length,
      accountsDataSource
    });
  }, [dataSource, userId, user, status, accounts, accountsDataSource]);
  
  // Add separate effect to focus on account changes
  useEffect(() => {
    console.log("[BUG] ACCOUNTS CHANGED:", accounts.length, "accounts", 
      accounts.map(a => ({id: a.id, name: a.name, balance: a.balance}))
    );
  }, [accounts]);

  return null;
}; 