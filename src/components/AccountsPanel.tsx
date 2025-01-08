import { Account, AccountType, CurrencyCode } from "@/components/AccountsList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AddAccountDialog } from "@/components/AddAccountDialog";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

interface AccountsPanelProps {
  accounts: Account[];
  type: "assets" | "liabilities";
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

export function AccountsPanel({
  accounts,
  type,
  onEditAccount,
  onDeleteAccount,
}: AccountsPanelProps) {
  const filteredAccounts = accounts.filter((account) =>
    type === "assets" ? !account.isDebt : account.isDebt,
  );

  const groupedAccounts = filteredAccounts.reduce(
    (acc, account) => {
      if (!acc[account.type]) {
        acc[account.type] = [];
      }
      acc[account.type].push(account);
      return acc;
    },
    {} as Record<AccountType, Account[]>,
  );

  const formatAccountBalance = (account: Account) => {
    const symbol = CURRENCY_SYMBOLS[account.currency];
    const formatted = formatCurrency(Math.abs(account.balance)).replace(
      /^\$/,
      "",
    );
    // Balance is already negative for debts, so just format accordingly
    return account.balance < 0
      ? `-${symbol}${formatted}`
      : `${symbol}${formatted}`;
  };

  if (filteredAccounts.length === 0) {
    return (
      <Alert variant="default" className="mt-4 bg-muted/50">
        <PlusCircle className="h-4 w-4 text-muted-foreground" />
        <AlertDescription>
          Add your first {type === "assets" ? "asset" : "liability"} account to
          start tracking
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedAccounts).map(([type, accounts]) => (
        <div key={type} className="space-y-4">
          <div className="font-medium text-sm text-muted-foreground">
            {type}
          </div>
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
                  <p
                    className={`text-sm ${account.balance < 0 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {formatAccountBalance(account)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <AddAccountDialog
                    onAddAccount={() => {}} // Not used in edit mode
                    onEditAccount={onEditAccount}
                    account={account}
                    trigger={
                      <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        Edit
                      </button>
                    }
                  />
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
  );
}
