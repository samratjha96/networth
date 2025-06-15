import { useContext } from "react";
import { AppDataContext } from "@/contexts/AppDataContext";

// Hook for using the AppDataContext
export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
