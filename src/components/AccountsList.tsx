import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState, useEffect } from "react";
import { AccountsPanel } from "./AccountsPanel";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { AddAccountDialog } from "./AddAccountDialog";
import { Button } from "@/components/ui/button";
import { getAccountColor } from "@/lib/utils";
import { AccountType } from "@/types";
import {
  useAccountsStore,
  useAccountsAutoReload,
} from "@/store/accounts-store";
import { useAccountDialogStore } from "@/store/account-dialog-store";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/components/AuthProvider";

export function AccountsList() {
  const [view, setView] = useState<"assets" | "liabilities">("assets");
  const { accounts, loadAccounts, isLoading } = useAccountsStore();
  const { openAddDialog } = useAccountDialogStore();
  const { backendType } = useDatabase();
  const { user } = useAuth();

  // Use the auto-reload hook to ensure accounts are loaded when the user changes
  useAccountsAutoReload();

  // Load accounts when component mounts or backend/user changes
  useEffect(() => {
    console.debug("Loading accounts - backend or user changed", {
      backendType,
      userId: user?.id,
      accountsCount: accounts.length,
    });
    loadAccounts();
  }, [loadAccounts, backendType, user]);

  // No need for dialog open state or account to edit - all managed by the store now

  const assetAccounts = accounts.filter((a) => !a.isDebt);
  const liabilityAccounts = accounts.filter((a) => a.isDebt);

  const assetTotal = assetAccounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  const liabilityTotal = liabilityAccounts.reduce(
    (sum, account) => sum + Math.abs(account.balance),
    0,
  );

  // Calculate net worth
  const netWorth = assetTotal - liabilityTotal;

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
                    onClick={() => openAddDialog()}
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
              onValueChange={(v) => v && setView(v as "assets" | "liabilities")}
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
          <AccountsPanel type={view} accounts={accounts} />
        </CardContent>
      </Card>
    </>
  );
}
