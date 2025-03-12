import { createContext } from "react";

export interface TestModeContextType {
  isTestMode: boolean;
  toggleTestMode: () => void;
}

export const TestModeContext = createContext<TestModeContextType | undefined>(
  undefined,
);
