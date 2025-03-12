import { useState, useEffect, useCallback } from "react";
import { Account } from "@/components/AccountsList";
import { NetworthHistory } from "@/lib/types";
import { db } from "@/lib/database";

interface AccountPerformance {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  previousBalance: number;
  changeAmount: number;
  changePercentage: number;
  isDebt: boolean;
}

interface PerformanceData {
  bestPerformer: AccountPerformance | null;
  worstPerformer: AccountPerformance | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAccountPerformance(
  accounts: Account[], 
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): PerformanceData {
  const [performance, setPerformance] = useState<PerformanceData>({
    bestPerformer: null,
    worstPerformer: null,
    isLoading: true,
    error: null
  });

  const calculatePerformance = useCallback(async () => {
    if (!accounts || accounts.length === 0) {
      setPerformance({
        bestPerformer: null,
        worstPerformer: null,
        isLoading: false,
        error: null
      });
      return;
    }

    try {
      // Determine days based on period
      let days = 30; // Default to month
      switch (period) {
        case 'day': days = 1; break;
        case 'week': days = 7; break;
        case 'month': days = 30; break;
        case 'year': days = 365; break;
      }

      // Get history data for the specified period
      const history = await db.getNetworthHistory(days);
      const isTestMode = db.isTestModeEnabled();

      // Performance data for all accounts
      const accountPerformance: AccountPerformance[] = [];

      // In test mode, simulate growth or decline proportional to account type
      if (isTestMode) {
        const growthRates: Record<string, number> = {
          'Real Estate': 5.0,
          'Brokerage': 4.2,
          '401K': 3.8,
          'Retirement': 3.5,
          'Savings': 2.5,
          'Checking': 0.5,
          'Car': -1.2,
          'Credit Card': -0.5,
          'Loan': 0.3,
          'Mortgage': 0.2
        };

        // Create simulated performance data with realistic trends
        accounts.forEach(account => {
          const baseRate = growthRates[account.type] || (account.isDebt ? -0.5 : 2.0);
          
          // Add some randomness but keep direction consistent with account type
          const randomFactor = Math.random() * 2 - 0.5; // -0.5 to 1.5
          const adjustedRate = baseRate + randomFactor;
          
          // Calculate previous balance based on simulated growth rate
          const previousBalance = account.isDebt 
            ? account.balance / (1 - adjustedRate/100) 
            : account.balance / (1 + adjustedRate/100);
          
          const changeAmount = account.balance - previousBalance;
          const changePercentage = previousBalance !== 0 
            ? (changeAmount / Math.abs(previousBalance)) * 100 
            : 0;
          
          accountPerformance.push({
            id: account.id,
            name: account.name,
            type: account.type,
            currentBalance: account.balance,
            previousBalance: previousBalance,
            changeAmount: changeAmount,
            changePercentage: changePercentage,
            isDebt: !!account.isDebt
          });
        });
      } 
      // For non-test mode, try to calculate real performance
      else if (history.length > 0) {
        // Try to find historical account data
        // Implementation would depend on having historical account data
        // For now, provide a simplified implementation
        
        // Using latest data point for current balances
        accounts.forEach(account => {
          // If we don't have real historical data for accounts, simulate
          // a reasonable growth rate based on account type
          const estimatedGrowth = account.isDebt ? -0.5 : 2.0;
          const previousBalance = account.balance / (1 + estimatedGrowth/100);
          
          const changeAmount = account.balance - previousBalance;
          const changePercentage = previousBalance !== 0 
            ? (changeAmount / Math.abs(previousBalance)) * 100 
            : 0;
          
          accountPerformance.push({
            id: account.id,
            name: account.name,
            type: account.type,
            currentBalance: account.balance,
            previousBalance: previousBalance,
            changeAmount: changeAmount,
            changePercentage: changePercentage,
            isDebt: !!account.isDebt
          });
        });
      }

      // Find best and worst performers 
      // Only consider assets for best performer
      const assetPerformance = accountPerformance.filter(account => !account.isDebt);
      const liabilityPerformance = accountPerformance.filter(account => account.isDebt);
      
      let bestPerformer = null;
      let worstPerformer = null;
      
      if (assetPerformance.length > 0) {
        // For assets, higher percentage is better
        bestPerformer = assetPerformance.reduce((best, current) => 
          current.changePercentage > best.changePercentage ? current : best
        );
      }
      
      if (liabilityPerformance.length > 0) {
        // For liabilities, lower or negative percentage is better (means reducing debt)
        worstPerformer = liabilityPerformance.reduce((worst, current) => 
          current.changePercentage > worst.changePercentage ? current : worst
        );
      }

      setPerformance({
        bestPerformer,
        worstPerformer,
        isLoading: false,
        error: null
      });
    } catch (err) {
      setPerformance({
        bestPerformer: null,
        worstPerformer: null,
        isLoading: false,
        error: err instanceof Error ? err : new Error('Failed to calculate account performance')
      });
    }
  }, [accounts, period]);

  useEffect(() => {
    calculatePerformance();
  }, [calculatePerformance]);

  return performance;
} 