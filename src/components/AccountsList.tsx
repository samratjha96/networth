import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import { AccountsPanel } from "./AccountsPanel";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { AddAccountDialog } from "./AddAccountDialog";
import { Button } from "@/components/ui/button";

export type AssetType =
  | "Checking"
  | "Savings"
  | "Brokerage"
  | "Retirement"
  | "401K"
  | "Car"
  | "Real Estate";

export type DebtType = "Credit Card" | "Loan" | "Mortgage";

export type AccountType = AssetType | DebtType;

export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  isDebt?: boolean;
  currency: CurrencyCode;
}

interface AccountsListProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onAddAccount: (account: Omit<Account, "id">) => void;
}

export function AccountsList({
  accounts,
  onEditAccount,
  onDeleteAccount,
  onAddAccount,
}: AccountsListProps) {
  const [view, setView] = useState<"assets" | "liabilities">("assets");

  const assetsTotal = accounts
    .filter((account) => !account.isDebt)
    .reduce((sum, account) => sum + account.balance, 0);

  const liabilitiesTotal = accounts
    .filter((account) => account.isDebt)
    .reduce((sum, account) => sum + Math.abs(account.balance), 0);

  return (
    <Card className="bg-background border-border shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-background to-background/80 border-b py-3 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Accounts</CardTitle>
            <span className="text-sm text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded-full">
              {accounts.length} total
            </span>
            <AddAccountDialog
              onAddAccount={onAddAccount}
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {view === "assets" && assetsTotal > 0 && (
              <div className="flex items-center text-sm md:text-base font-medium text-green-600">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                <span>
                  Total Assets: $
                  {assetsTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
            {view === "liabilities" && liabilitiesTotal > 0 && (
              <div className="flex items-center text-sm md:text-base font-medium text-red-600">
                <TrendingDown className="h-4 w-4 mr-1.5" />
                <span>
                  Total Liabilities: $
                  {liabilitiesTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(value) =>
                value && setView(value as "assets" | "liabilities")
              }
              className="bg-muted/30 p-0.5 border"
            >
              <ToggleGroupItem
                value="assets"
                className="text-sm md:text-base flex gap-1.5 items-center px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Assets</span>
                <span className="text-xs font-medium rounded-full bg-green-100 text-green-700 px-2 py-0.5 ml-1">
                  {accounts.filter((a) => !a.isDebt).length}
                </span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="liabilities"
                className="text-sm md:text-base flex gap-1.5 items-center px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                <TrendingDown className="h-4 w-4" />
                <span>Liabilities</span>
                <span className="text-xs font-medium rounded-full bg-red-100 text-red-700 px-2 py-0.5 ml-1">
                  {accounts.filter((a) => a.isDebt).length}
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <AccountsPanel
          accounts={accounts}
          type={view}
          onEditAccount={onEditAccount}
          onDeleteAccount={onDeleteAccount}
        />
      </CardContent>
    </Card>
  );
}
