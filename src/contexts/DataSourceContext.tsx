import { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";

type DataSource = "local" | "remote";

interface DataSourceContextType {
  dataSource: DataSource;
  userId: string | null;
}

const DataSourceContext = createContext<DataSourceContextType>({
  dataSource: "local",
  userId: null,
});

export const useDataSource = () => useContext(DataSourceContext);

export const DataSourceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Store context values in local state
  const [contextValue, setContextValue] = useState<DataSourceContextType>({
    dataSource: "local",
    userId: null,
  });

  // Subscribe to the entire auth store
  const authState = useAuthStore();

  // Update the context value whenever auth state changes
  useEffect(() => {
    setContextValue({
      dataSource: authState.status === "authenticated" ? "remote" : "local",
      userId: authState.user?.id || null,
    });
  }, [authState.user, authState.status]);

  return (
    <DataSourceContext.Provider value={contextValue}>
      {children}
    </DataSourceContext.Provider>
  );
};
