import {
  AccountType,
  AccountWithValue,
  AccountViewType,
} from "@/types/accounts";
import { CURRENCY_SYMBOLS } from "@/types/currency";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlusCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Plus,
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
import { useAccountsStore } from "@/store/accounts-store";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface AccountsPanelProps {
  accounts: AccountWithValue[];
  type: AccountViewType;
}

type CollapsedSections = Record<string, boolean>;

const useCollapsibleSections = (panelType: AccountViewType) => {
  const storageKey = `collapsed-sections-${panelType}`;

  const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>(
    {},
  );

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        setCollapsedSections(JSON.parse(savedState));
      }
    } catch (error) {
      console.error(
        "Failed to load collapsed sections from localStorage:",
        error,
      );
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(collapsedSections));
    } catch (error) {
      console.error(
        "Failed to save collapsed sections to localStorage:",
        error,
      );
    }
  }, [collapsedSections, storageKey]);

  const toggleSection = (sectionType: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionType]: !prev[sectionType],
    }));
  };

  return { collapsedSections, toggleSection };
};

export function AccountsPanel({ accounts, type }: AccountsPanelProps) {
  const { openEditDialog, openAddDialog, deleteAccount } = useAccountsStore();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { collapsedSections, toggleSection } = useCollapsibleSections(type);

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
    {} as Record<AccountType, AccountWithValue[]>,
  );

  const formatAccountBalance = (account: AccountWithValue) => {
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
      <div className="p-4">
        <AddAccountDialog
          trigger={
            <Button className="w-full gap-2 text-lg py-6" variant="outline">
              <Plus className="h-5 w-5" />
              Add {type === "assets" ? "Asset" : "Liability"}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="relative space-y-6 p-4">
      {/* Main Panel Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {type === "assets" ? "Assets" : "Liabilities"}
        </h2>
        <AddAccountDialog
          trigger={
            <Button
              className="shadow-lg hover:shadow-xl transition-all gap-2"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Add {type === "assets" ? "Asset" : "Liability"}
            </Button>
          }
        />
      </div>

      {Object.entries(groupedAccounts).map(([type, accounts]) => (
        <div
          key={type}
          className="rounded-lg border bg-card/50 backdrop-blur-sm overflow-hidden"
        >
          <div
            className="flex items-center px-4 py-3 group cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection(type)}
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl" aria-hidden="true">
                {accountTypeEmojis[type as AccountType] || "💰"}
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {type}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {accounts.length}
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 ml-2 shrink-0"
              aria-label={
                collapsedSections[type] ? "Expand section" : "Collapse section"
              }
            >
              {collapsedSections[type] ? (
                <ChevronDown className="h-5 w-5 transition-transform duration-200" />
              ) : (
                <ChevronUp className="h-5 w-5 transition-transform duration-200" />
              )}
            </Button>
          </div>

          {!collapsedSections[type] && (
            <div className="p-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((account) => {
                  const colors = getAccountColor(
                    account.type as AccountType,
                    account.isDebt,
                  );
                  return (
                    <div
                      key={account.id}
                      className={cn(
                        "group relative rounded-lg overflow-hidden",
                        "bg-card border shadow-sm hover:shadow-md",
                        "transition-all duration-200 hover:scale-[1.02]",
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0 left-0 w-full h-1.5",
                          colors.borderColor,
                        )}
                      />
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <h4 className="text-lg font-semibold tracking-tight text-card-foreground">
                              {account.name}
                            </h4>
                            <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
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
                            "text-2xl font-bold tracking-tight",
                            account.isDebt
                              ? "text-red-500 dark:text-red-400"
                              : "text-green-600 dark:text-green-400",
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
          )}
        </div>
      ))}
    </div>
  );
}
