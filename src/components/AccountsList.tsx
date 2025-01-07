import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";

export type AccountType = 'Checking' | 'Savings' | 'Brokerage' | 'Retirement' | '401K' | 'Credit Card' | 'Loan' | 'Mortgage';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  isDebt?: boolean;
}

interface AccountsListProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

export function AccountsList({ accounts, onEditAccount, onDeleteAccount }: AccountsListProps) {
  const [view, setView] = useState<"assets" | "debts">("assets");
  
  const filteredAccounts = accounts.filter(account => 
    view === "assets" ? !account.isDebt : account.isDebt
  );

  const groupedAccounts = filteredAccounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<AccountType, Account[]>);

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Accounts</CardTitle>
          <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value as "assets" | "debts")}>
            <ToggleGroupItem value="assets" className="text-sm">
              Assets
            </ToggleGroupItem>
            <ToggleGroupItem value="debts" className="text-sm">
              Debts
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {Object.entries(groupedAccounts).map(([type, accounts]) => (
            <div key={type} className="space-y-4">
              <div className="font-medium text-sm text-muted-foreground">{type}</div>
              <div className="grid gap-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">
                        {account.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditAccount(account)}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteAccount(account.id)}
                        className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}