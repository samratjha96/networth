import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState, useEffect, useMemo, useRef } from "react";
import React from "react";
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
import { useAppAccounts } from "@/hooks/app-data";

export function AccountsList() {
  const [view, setView] = useState<AccountViewType>("assets");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountWithValue | null>(
    null,
  );

  // Use our centralized data hook
  const { accounts, isLoading, addAccount, updateAccount, deleteAccount } =
    useAppAccounts();

  // Filter accounts - these are good candidates for memoization to avoid recreating arrays on each render
  // Only recompute when accounts changes
  const assetAccounts = useMemo(
    () => accounts.filter((a) => !a.isDebt),
    [accounts],
  );
  const liabilityAccounts = useMemo(
    () => accounts.filter((a) => a.isDebt),
    [accounts],
  );

  // Dialog handlers
  const openAddDialog = (options?: { isDebt?: boolean }) => {
    setAccountToEdit(null);
    if (options?.isDebt) {
      // Set a default for the new account if it's a liability
      // This will be handled in the dialog component
    }
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (account: AccountWithValue) => {
    setAccountToEdit(account);
    setIsAddDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setAccountToEdit(null);
  };

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
          {isLoading ? (
            <div className="p-4 flex items-center justify-center">
              <p className="text-muted-foreground">Loading accounts...</p>
            </div>
          ) : (
            <SplitAccountsLayout
              type={view}
              accounts={accounts}
              onEditAccount={openEditDialog}
              onDeleteAccount={deleteAccount}
              onAddAccount={openAddDialog}
              onUpdateAccount={updateAccount}
            />
          )}
        </CardContent>
      </Card>

      {isAddDialogOpen && (
        <AddAccountDialog
          isOpen={isAddDialogOpen}
          onClose={closeDialog}
          onAddAccount={addAccount}
          onUpdateAccount={updateAccount}
          accountToEdit={accountToEdit}
          defaultIsDebt={view === "liabilities"}
        />
      )}
    </>
  );
}

type CollapsedSections = Record<string, boolean>;

function useCollapsibleSections(panelType: AccountViewType) {
  const storageKey = `collapsed-sections-${panelType}`;

  const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>(
    () => {
      try {
        const savedState = localStorage.getItem(storageKey);
        return savedState ? JSON.parse(savedState) : {};
      } catch (error) {
        console.error(
          "Failed to load collapsed sections from localStorage:",
          error,
        );
        return {};
      }
    },
  );

  // Effect to persist collapsed sections state to localStorage
  // Dependencies are correctly specified: collapsedSections (the data we're saving)
  // and storageKey (where we're saving it)
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

interface SplitAccountsLayoutProps {
  accounts: AccountWithValue[];
  type: AccountViewType;
  onEditAccount: (account: AccountWithValue) => void;
  onDeleteAccount: (id: string) => void;
  onAddAccount: (options?: { isDebt?: boolean }) => void;
  onUpdateAccount: (account: AccountWithValue) => void;
}

function SplitAccountsLayout({
  accounts,
  type,
  onEditAccount,
  onDeleteAccount,
  onAddAccount,
  onUpdateAccount,
}: SplitAccountsLayoutProps) {
  const filteredAccounts = accounts.filter((account) =>
    type === "assets" ? !account.isDebt : account.isDebt,
  );

  // Group accounts by their type - this is a good candidate for memoization
  // as it's a potentially expensive operation that creates new objects
  // This should only be recalculated when filteredAccounts changes
  const groupedAccounts = useMemo(() => {
    return filteredAccounts.reduce(
      (acc, account) => {
        if (!acc[account.type]) {
          acc[account.type] = [];
        }
        acc[account.type].push(account);
        return acc;
      },
      {} as Record<AccountType, AccountWithValue[]>,
    );
  }, [filteredAccounts]);

  // Get all account types - derive these from the memoized groupedAccounts
  const accountTypes = useMemo(() => {
    return Object.keys(groupedAccounts) as AccountType[];
  }, [groupedAccounts]);

  // Distribute account types between two columns (alternating)
  // These are derived from accountTypes which is already memoized
  const leftColumnTypes = useMemo(() => {
    return accountTypes.filter((_, i) => i % 2 === 0);
  }, [accountTypes]);

  const rightColumnTypes = useMemo(() => {
    return accountTypes.filter((_, i) => i % 2 === 1);
  }, [accountTypes]);

  if (filteredAccounts.length === 0) {
    return (
      <Alert variant="default" className="m-4 bg-muted/50 border border-dashed">
        <PlusCircle className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span>
            Add your first {type === "assets" ? "asset" : "liability"} account
            to start tracking
          </span>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary/10"
            onClick={() => onAddAccount({ isDebt: type === "liabilities" })}
          >
            Add {type === "assets" ? "Asset" : "Liability"}
          </Badge>
        </AlertDescription>
      </Alert>
    );
  }

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
            onEditAccount={onEditAccount}
            onDeleteAccount={onDeleteAccount}
            onUpdateAccount={onUpdateAccount}
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
              onEditAccount={onEditAccount}
              onDeleteAccount={onDeleteAccount}
              onUpdateAccount={onUpdateAccount}
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
              onEditAccount={onEditAccount}
              onDeleteAccount={onDeleteAccount}
              onUpdateAccount={onUpdateAccount}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface AccountTypeSectionProps {
  type: AccountViewType;
  accountType: AccountType;
  accounts: AccountWithValue[];
  onEditAccount: (account: AccountWithValue) => void;
  onDeleteAccount: (id: string) => void;
  onUpdateAccount: (account: AccountWithValue) => void;
}

interface EditableBalanceProps {
  account: AccountWithValue;
  onUpdateBalance: (accountId: string, newBalance: number) => void;
}

function EditableBalance({ account, onUpdateBalance }: EditableBalanceProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleClick = () => {
    setIsEditing(true);
    setEditValue(Math.abs(account.balance).toString());
  };

  const handleSave = () => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue)) {
      // For liability accounts, ensure the balance is negative (same logic as AddAccountDialog)
      const finalValue = account.isDebt && numValue > 0 ? -numValue : numValue;
      onUpdateBalance(account.id, finalValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn(
            "text-lg font-semibold bg-transparent border-b-2 border-primary outline-none w-full",
            account.isDebt
              ? "text-red-500"
              : "text-green-600 dark:text-green-500",
          )}
          placeholder="Enter amount"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "text-lg font-semibold cursor-pointer hover:bg-muted/20 rounded px-1 py-0.5 transition-colors",
        account.isDebt ? "text-red-500" : "text-green-600 dark:text-green-500",
      )}
      onClick={handleClick}
      title="Click to edit balance"
    >
      {formatAccountBalance(account)}
    </div>
  );
}

// Properly using local state for component-specific UI state
function AccountTypeSection({
  type,
  accountType,
  accounts,
  onEditAccount,
  onDeleteAccount,
  onUpdateAccount,
}: AccountTypeSectionProps) {
  // This state is correctly kept local to this component as it's UI-specific
  const { collapsedSections, toggleSection } = useCollapsibleSections(type);
  // This state is also correctly kept local as it only affects UI within this component
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleUpdateBalance = (accountId: string, newBalance: number) => {
    const account = accounts.find((a) => a.id === accountId);
    if (account) {
      const updatedAccount = { ...account, balance: newBalance };
      onUpdateAccount(updatedAccount);
    }
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
          <span className="px-1.5 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">
            {accounts.length}
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
                              onEditAccount(account);
                            }, 100);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDeleteAccount(account.id);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <EditableBalance
                    account={account}
                    onUpdateBalance={handleUpdateBalance}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
