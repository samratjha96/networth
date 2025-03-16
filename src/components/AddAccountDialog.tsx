import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AccountType, assetTypes, debtTypes } from "@/types/accounts";
import { CURRENCIES, CurrencyCode } from "@/types/currency";
import { useAccountDialogStore } from "@/store/account-dialog-store";

interface AddAccountDialogProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function AddAccountDialog({
  trigger,
  className,
}: AddAccountDialogProps) {
  // Get dialog state and actions from the store
  const {
    isOpen,
    accountToEdit,
    defaultIsDebt,
    closeDialog,
    addAccount,
    editAccount,
  } = useAccountDialogStore();

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<AccountType>("Checking");
  const [balance, setBalance] = React.useState("");
  const [currency, setCurrency] = React.useState<CurrencyCode>("USD");
  const [isDebt, setIsDebt] = React.useState(false);
  const [touched, setTouched] = React.useState({
    name: false,
    balance: false,
  });

  // Reset form when dialog opens and when account changes
  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        setName(accountToEdit.name);
        setType(accountToEdit.type);
        setBalance(Math.abs(accountToEdit.balance).toString());
        setCurrency(accountToEdit.currency as CurrencyCode);
        setIsDebt(accountToEdit.isDebt ?? false);
      } else {
        setName("");
        setType(defaultIsDebt ? debtTypes[0] : "Checking");
        setBalance("");
        setCurrency("USD");
        setIsDebt(defaultIsDebt);
      }
      setTouched({ name: false, balance: false });
    }
  }, [isOpen, accountToEdit, defaultIsDebt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!name.trim() || !balance.trim()) {
      setTouched({ name: true, balance: true });
      return;
    }

    // Convert balance to number
    let numericBalance = parseFloat(balance) || 0;

    // For liability accounts, ensure the balance is negative
    if (isDebt && numericBalance > 0) {
      numericBalance = -numericBalance;
    }

    const accountData = {
      name: name.trim(),
      type,
      balance: numericBalance,
      isDebt,
      currency,
    };

    if (accountToEdit) {
      editAccount({ ...accountData, id: accountToEdit.id });
    } else {
      addAccount(accountData);
    }

    // Form will be reset by the useEffect when isOpen changes
  };

  const handleDebtToggle = (checked: boolean) => {
    if (!accountToEdit) {
      setIsDebt(checked);
      setType(checked ? debtTypes[0] : assetTypes[0]);
    }
  };

  const isNameError = touched.name && !name.trim();
  const isBalanceError = touched.balance && !balance.trim();
  const isValid = name.trim() && balance.trim();

  // Get available account types based on whether it's an asset or liability
  const availableTypes = isDebt ? debtTypes : assetTypes;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogTrigger asChild>
        <div>
          {trigger ?? (
            <Button variant="outline" className={className}>
              Add Account
            </Button>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {accountToEdit ? "Edit Account" : "Add New Account"}
          </DialogTitle>
          <DialogDescription>
            {accountToEdit ? "Edit" : "Add a new"}{" "}
            {isDebt ? "liability" : "asset"} account to track your net worth.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="debt-mode"
              checked={isDebt}
              onCheckedChange={handleDebtToggle}
              disabled={!!accountToEdit}
            />
            <Label htmlFor="debt-mode">This is a liability</Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name" className="flex items-center gap-1">
              Account Name
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              className={`col-span-3 bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.1)] focus-visible:shadow-[0_0_0_1px_hsl(var(--primary))] ${
                isNameError ? "shadow-[0_0_0_1px_hsl(var(--destructive))]" : ""
              }`}
              aria-invalid={isNameError}
            />
            {isNameError && (
              <p className="text-sm text-destructive">Name is required</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Account Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as AccountType)}
            >
              <SelectTrigger className="bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.1)] focus-visible:shadow-[0_0_0_1px_hsl(var(--primary))]">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={currency}
              onValueChange={(value) => setCurrency(value as CurrencyCode)}
            >
              <SelectTrigger className="bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.1)] focus-visible:shadow-[0_0_0_1px_hsl(var(--primary))]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(({ code, symbol, name }) => (
                  <SelectItem key={code} value={code}>
                    {symbol} {code} - {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="balance" className="flex items-center gap-1">
              Balance
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="balance"
              type="number"
              step="any"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, balance: true }))}
              className={`col-span-3 bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.1)] focus-visible:shadow-[0_0_0_1px_hsl(var(--primary))] ${
                isBalanceError
                  ? "shadow-[0_0_0_1px_hsl(var(--destructive))]"
                  : ""
              }`}
              aria-invalid={isBalanceError}
            />
            {isBalanceError && (
              <p className="text-sm text-destructive">Balance is required</p>
            )}
          </div>

          <Button type="submit" disabled={!isValid}>
            {accountToEdit ? "Save Changes" : "Add Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
