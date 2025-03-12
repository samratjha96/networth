import { Account, AccountType, CurrencyCode } from "@/components/AccountsList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlusCircle,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency, accountTypeEmojis } from "@/lib/utils";
import { AddAccountDialog } from "@/components/AddAccountDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onAddAccount: (account: Omit<Account, "id">) => void;
}

export function AccountsPanel({
  accounts,
  type,
  onEditAccount,
  onDeleteAccount,
  onAddAccount,
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
            onAddAccount={onAddAccount}
            onEditAccount={onEditAccount}
            trigger={
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3">
      {Object.entries(groupedAccounts).map(([type, accounts]) => (
        <div key={type} className="border rounded-md overflow-hidden shadow-sm">
          <div className="px-3 py-2.5 font-medium text-base flex items-center gap-1.5 bg-muted/40 border-b">
            <span className="text-xl">
              {accountTypeEmojis[type as AccountType]}
            </span>
            <span>{type}</span>
            <Badge variant="outline" className="font-normal ml-2 text-xs">
              {accounts.length}
            </Badge>
          </div>
          <div className="p-2.5 space-y-2">
            {accounts.map((account) => {
              const isNegative = account.balance < 0;
              const accountColor =
                isNegative && type === "assets"
                  ? "text-red-500"
                  : type === "assets"
                    ? "text-green-500"
                    : "text-orange-500";

              return (
                <div
                  key={account.id}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-md bg-card hover:bg-accent/10 transition-colors",
                    "border-l-4",
                    isNegative && type === "assets"
                      ? "border-l-red-500/80"
                      : type === "assets"
                        ? "border-l-green-500/80"
                        : "border-l-orange-500/80",
                  )}
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center space-x-1.5 truncate">
                      <p className="text-base font-medium leading-tight truncate">
                        {account.name}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-xs py-0 h-5 shrink-0"
                      >
                        {account.currency}
                      </Badge>
                    </div>
                    <div className="flex items-center mt-1.5">
                      <p
                        className={`text-base font-medium ${accountColor} truncate`}
                      >
                        {formatAccountBalance(account)}
                      </p>
                    </div>
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

                          console.log("Edit button clicked", {
                            account: account.name,
                          });

                          // Give time for the menu to process the click before showing dialog
                          setTimeout(() => {
                            onEditAccount(account);
                          }, 100);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-500 focus:text-red-500"
                        onClick={() => onDeleteAccount(account.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
