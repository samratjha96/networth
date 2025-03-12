import { useContext } from "react";
import { TestModeContext } from "./test-mode-context-utils";

export function useTestMode() {
  const context = useContext(TestModeContext);
  if (context === undefined) {
    throw new Error("useTestMode must be used within a TestModeProvider");
  }
  return context;
} 