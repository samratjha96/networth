import { useContext } from "react";
import { DataSourceContext } from "@/contexts/data-source-context";

// Hook for using the DataSourceContext
export function useDataSource() {
  return useContext(DataSourceContext);
}
