import { Account, AccountType } from "@/types/accounts";
import { CurrencyCode, CURRENCY_SYMBOLS } from "@/types/currency";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlusCircle,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  formatCurrency,
  accountTypeEmojis,
  getAccountColor,
  cn,
} from "@/lib/utils";
import { AddAccountDialog } from "@/components/AddAccountDialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccountDialogStore } from "@/store/account-dialog-store";
import { useAccountsStore } from "@/store/accounts-store";

interface AccountsPanelProps {
  accounts: Account[];
  type: "assets" | "liabilities";
}

export function AccountsPanel({ accounts, type }: AccountsPanelProps) {
  const { openEditDialog } = useAccountDialogStore();
  const { deleteAccount } = useAccountsStore();
  const { openAddDialog } = useAccountDialogStore();

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
    return account.balance < 0
      ? `-${symbol}${formatted}`
      : `${symbol}${formatted}`;
  };

  if (filteredAccounts.length === 0) {
    return (
      <Alert variant="default" className="m-4 bg-muted/50 border border-dashed">
        <PlusCircle className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span>
            Add your first {type === "assets" ? "asset" : "liability"} account
            to start tracking
          </span>
          <AddAccountDialog
            trigger={
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => openAddDialog()}
              >
                Add {type === "assets" ? "Asset" : "Liability"}
              </Badge>
            }
          />
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {Object.entries(groupedAccounts).map(([type, accounts]) => (
        <div key={type} className="border rounded-md overflow-hidden shadow-sm">
          <div className="bg-muted/30 px-3 py-1.5 border-b flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-lg" aria-hidden="true">
                {accountTypeEmojis[type as AccountType] || "💰"}
              </span>
              <h3 className="font-medium">{type}</h3>
              <span className="text-xs text-muted-foreground">
                {accounts.length}{" "}
                {accounts.length === 1 ? "account" : "accounts"}
              </span>
            </div>
          </div>
          <div className="divide-y">
            {accounts.map((account) => {
              const colors = getAccountColor(
                account.type as AccountType,
                account.isDebt,
              );
              return (
                <div
                  key={account.id}
                  className="px-3 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-7 w-1.5 rounded-full shrink-0",
                        colors.borderColor,
                      )}
                    />
                    <div>
                      <div className="font-medium">{account.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {account.type}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div
                      className={cn(
                        "font-semibold",
                        account.isDebt
                          ? "text-red-500"
                          : "text-green-600 dark:text-green-500",
                      )}
                    >
                      {formatAccountBalance(account)}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground shrink-0 ml-1.5">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={(e) => {
                            // Stop here to prevent the menu from closing right away
                            e.preventDefault();
                            e.stopPropagation();

                            // Give time for the menu to process the click before showing dialog
                            setTimeout(() => {
                              openEditDialog(account);
                            }, 100);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-red-500 focus:text-red-500"
                          onClick={() => deleteAccount(account.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
