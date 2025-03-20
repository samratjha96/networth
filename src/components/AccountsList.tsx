import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from "lucide-react";
import { AddAccountDialog } from "./AddAccountDialog";
import { Button } from "@/components/ui/button";
import { useAccountsStore } from "@/store/accounts-store";
import {
  AccountType,
  AccountViewType,
  AccountWithValue,
} from "@/types/accounts";
import { CURRENCY_SYMBOLS } from "@/types/currency";
import {
  cn,
  formatCurrency,
  accountTypeEmojis,
  getAccountColor,
} from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

export function AccountsList() {
  const [view, setView] = useState<AccountViewType>("assets");
  const { accounts, openAddDialog } = useAccountsStore();

  // Filter accounts
  const assetAccounts = accounts.filter((a) => !a.isDebt);
  const liabilityAccounts = accounts.filter((a) => a.isDebt);

  return (
    <>
      <Card className="bg-background border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-background to-background/80 border-b py-3 px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Accounts</CardTitle>
              <span className="text-sm text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded-full">
                {accounts.length} total
              </span>
              <AddAccountDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      openAddDialog({ isDebt: view === "liabilities" })
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
            </div>

            <ToggleGroup
              type="single"
              defaultValue="assets"
              value={view}
              onValueChange={(v) => v && setView(v as AccountViewType)}
              className="bg-muted/50 p-0.5 rounded-md"
            >
              <ToggleGroupItem
                value="assets"
                size="sm"
                className="data-[state=on]:shadow-sm gap-1.5 h-8 px-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Assets</span>
                <span className="px-1.5 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">
                  {assetAccounts.length}
                </span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="liabilities"
                size="sm"
                className="data-[state=on]:shadow-sm gap-1.5 h-8 px-2"
              >
                <TrendingDown className="h-4 w-4" />
                <span>Liabilities</span>
                <span className="px-1.5 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">
                  {liabilityAccounts.length}
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>

        <CardContent className="p-0 pb-2">
          <SplitAccountsLayout type={view} accounts={accounts} />
        </CardContent>
      </Card>
    </>
  );
}

type CollapsedSections = Record<string, boolean>;

function useCollapsibleSections(panelType: AccountViewType) {
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
}

function SplitAccountsLayout({
  accounts,
  type,
}: {
  accounts: AccountWithValue[];
  type: AccountViewType;
}) {
  const { openAddDialog } = useAccountsStore();
  const filteredAccounts = accounts.filter((account) =>
    type === "assets" ? !account.isDebt : account.isDebt,
  );

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

  // Group accounts by their type
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

  // Get all account types
  const accountTypes = Object.keys(groupedAccounts) as AccountType[];

  // Distribute account types between two columns (alternating)
  const leftColumnTypes = accountTypes.filter((_, i) => i % 2 === 0);
  const rightColumnTypes = accountTypes.filter((_, i) => i % 2 === 1);

  return (
    <div className="p-3">
      {/* Mobile view - single column */}
      <div className="md:hidden">
        {accountTypes.map((accType) => (
          <AccountTypeSection
            key={accType}
            type={type}
            accountType={accType}
            accounts={groupedAccounts[accType]}
          />
        ))}
      </div>

      {/* Desktop view - two column layout */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-3">
        <div className="space-y-3">
          {leftColumnTypes.map((accType) => (
            <AccountTypeSection
              key={accType}
              type={type}
              accountType={accType}
              accounts={groupedAccounts[accType]}
            />
          ))}
        </div>

        <div className="space-y-3">
          {rightColumnTypes.map((accType) => (
            <AccountTypeSection
              key={accType}
              type={type}
              accountType={accType}
              accounts={groupedAccounts[accType]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountTypeSection({
  type,
  accountType,
  accounts,
}: {
  type: AccountViewType;
  accountType: AccountType;
  accounts: AccountWithValue[];
}) {
  const { collapsedSections, toggleSection } = useCollapsibleSections(type);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { openEditDialog, deleteAccount } = useAccountsStore();

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

  return (
    <div className="space-y-3 w-full">
      {/* Header */}
      <div
        className="flex items-center px-2 group cursor-pointer hover:bg-muted/50 rounded-md py-2 transition-colors"
        onClick={() => toggleSection(accountType)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">
            {accountTypeEmojis[accountType] || "💰"}
          </span>
          <h3 className="font-medium">{accountType}</h3>
          <span className="text-xs text-muted-foreground">
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 ml-1 text-muted-foreground group-hover:text-foreground transition-transform duration-200"
            aria-label={
              collapsedSections[accountType]
                ? "Expand section"
                : "Collapse section"
            }
            onClick={(e) => {
              e.stopPropagation();
              toggleSection(accountType);
            }}
          >
            {collapsedSections[accountType] ? (
              <ChevronDown className="h-4 w-4 transition-transform duration-200 transform group-hover:scale-110" />
            ) : (
              <ChevronUp className="h-4 w-4 transition-transform duration-200 transform group-hover:scale-110" />
            )}
          </Button>
        </div>
      </div>

      {/* Accounts */}
      {!collapsedSections[accountType] && (
        <div className="grid grid-cols-1 gap-3">
          {accounts.map((account) => {
            const colors = getAccountColor(accountType, account.isDebt);
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
      )}
    </div>
  );
}
