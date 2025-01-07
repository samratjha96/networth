import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export type AccountType = 'Checking' | 'Savings' | 'Brokerage' | 'Retirement' | '401K';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}

interface AccountsListProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

export function AccountsList({ accounts, onEditAccount, onDeleteAccount }: AccountsListProps) {
  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<AccountType, Account[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
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
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
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