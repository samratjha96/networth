import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useState } from "react";
import { AccountsPanel } from "./AccountsPanel";

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
}

export function AccountsList({
  accounts,
  onEditAccount,
  onDeleteAccount,
}: AccountsListProps) {
  const [view, setView] = useState<"assets" | "liabilities">("assets");

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Accounts</CardTitle>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) =>
              value && setView(value as "assets" | "liabilities")
            }
          >
            <ToggleGroupItem value="assets" className="text-sm">
              Assets
            </ToggleGroupItem>
            <ToggleGroupItem value="liabilities" className="text-sm">
              Liabilities
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
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
