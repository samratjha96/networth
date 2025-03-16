import { ReactNode, createContext, useContext, useState } from "react";

export interface TestModeContextType {
  isTestMode: boolean;
  toggleTestMode: () => void;
}

export const TestModeContext = createContext<TestModeContextType | undefined>(
  undefined,
);

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

export function useTestMode() {
  const context = useContext(TestModeContext);
  if (context === undefined) {
    throw new Error("useTestMode must be used within a TestModeProvider");
  }
  return context;
}
