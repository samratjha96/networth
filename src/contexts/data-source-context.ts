// Move context creation to separate file to avoid React Fast Refresh warning
import { createContext } from "react";

type DataSource = "local" | "remote";

export interface DataSourceContextType {
  dataSource: DataSource;
  userId: string | null;
}

export const DataSourceContext = createContext<DataSourceContextType>({
  dataSource: "local",
  userId: null,
});
