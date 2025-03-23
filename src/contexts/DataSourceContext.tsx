import { createContext, useContext } from "react";
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
  const { user, status } = useAuthStore();

  const value: DataSourceContextType = {
    dataSource: status === "authenticated" ? "remote" : "local",
    userId: user?.id || null,
  };

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
};
