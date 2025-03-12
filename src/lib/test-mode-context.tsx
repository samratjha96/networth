import { ReactNode, useState } from "react";
import { TestModeContext } from "./test-mode-context-utils";

export function TestModeProvider({ children }: { children: ReactNode }) {
  const [isTestMode, setIsTestMode] = useState(false);

  const toggleTestMode = () => {
    setIsTestMode((prev) => !prev);
  };

  return (
    <TestModeContext.Provider value={{ isTestMode, toggleTestMode }}>
      {children}
    </TestModeContext.Provider>
  );
} 