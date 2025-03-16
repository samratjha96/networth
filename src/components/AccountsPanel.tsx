import { Account, AccountType } from "@/types/accounts";
import { CURRENCY_SYMBOLS } from "@/types/currency";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, MoreHorizontal } from "lucide-react";
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
import { useState } from "react";

interface AccountsPanelProps {
  accounts: Account[];
  type: "assets" | "liabilities";
}

export function AccountsPanel({ accounts, type }: AccountsPanelProps) {
  const { openEditDialog } = useAccountDialogStore();
  const { deleteAccount } = useAccountsStore();
  const { openAddDialog } = useAccountDialogStore();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    <div className="space-y-4 p-3">
      {Object.entries(groupedAccounts).map(([type, accounts]) => (
        <div key={type} className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-lg" aria-hidden="true">
              {accountTypeEmojis[type as AccountType] || "💰"}
            </span>
            <h3 className="font-medium">{type}</h3>
            <span className="text-xs text-muted-foreground">
              {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {accounts.map((account) => {
              const colors = getAccountColor(
                account.type as AccountType,
                account.isDebt,
              );
              return (
                <div
                  key={account.id}
                  className={cn(
                    "relative rounded-lg overflow-hidden shadow-sm border",
                    "hover:shadow-md transition-shadow duration-200",
                    "bg-card",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0 left-0 w-full h-1",
                      colors.borderColor,
                    )}
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-card-foreground">
                          {account.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {account.type}
                        </p>
                      </div>
                      <DropdownMenu
                        open={openMenuId === account.id}
                        onOpenChange={(open) =>
                          setOpenMenuId(open ? account.id : null)
                        }
                      >
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-md hover:bg-accent text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuId(null);
                              setTimeout(() => {
                                openEditDialog(account);
                              }, 100);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => {
                              setOpenMenuId(null);
                              deleteAccount(account.id);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div
                      className={cn(
                        "text-lg font-semibold",
                        account.isDebt
                          ? "text-red-500"
                          : "text-green-600 dark:text-green-500",
                      )}
                    >
                      {formatAccountBalance(account)}
                    </div>
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
