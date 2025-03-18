import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState, useMemo } from "react";
import { AccountsPanel } from "./AccountsPanel";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { AddAccountDialog } from "./AddAccountDialog";
import { Button } from "@/components/ui/button";
import { useAccountsStore } from "@/store/accounts-store";
import { useAccounts } from "@/hooks/accounts/use-accounts";
import { AccountViewType } from "@/types/accounts";

export function AccountsList() {
  const [view, setView] = useState<AccountViewType>("assets");
  const { accounts } = useAccounts();
  const { openAddDialog } = useAccountsStore();

  const { assetAccounts, liabilityAccounts } = useMemo(() => {
    const assetAccounts = accounts.filter((a) => !a.isDebt);
    const liabilityAccounts = accounts.filter((a) => a.isDebt);

    return {
      assetAccounts,
      liabilityAccounts,
    };
  }, [accounts]);

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
          <AccountsPanel type={view} accounts={accounts} />
        </CardContent>
      </Card>
    </>
  );
}
