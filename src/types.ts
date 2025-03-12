export interface AccountPerformance {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  previousBalance: number;
  changeAmount: number;
  changePercentage: number;
  isDebt: boolean;
}

export interface PerformanceData {
  bestPerformer: AccountPerformance | null;
  worstPerformer: AccountPerformance | null;
  isLoading: boolean;
  error: Error | null;
} 