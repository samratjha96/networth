import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  AccountType,
  AccountWithValue,
  assetTypes,
  debtTypes,
} from "@/types/accounts";
import { CURRENCIES, CurrencyCode } from "@/types/currency";
import {
  isValidNumber,
  sanitizeNumber,
  sanitizeString,
} from "@/utils/input-validation";

interface AddAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (account: Omit<AccountWithValue, "id">) => void;
  onUpdateAccount: (account: AccountWithValue) => void;
  accountToEdit: AccountWithValue | null;
  defaultIsDebt?: boolean;
}

export function AddAccountDialog({
  isOpen,
  onClose,
  onAddAccount,
  onUpdateAccount,
  accountToEdit,
  defaultIsDebt = false,
}: AddAccountDialogProps) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<AccountType>("Checking");
  const [balance, setBalance] = React.useState("");
  const [currency, setCurrency] = React.useState<CurrencyCode>("USD");
  const [isDebt, setIsDebt] = React.useState(false);
  const [errors, setErrors] = React.useState({
    name: "",
    balance: "",
  });
  const [touched, setTouched] = React.useState({
    name: false,
    balance: false,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      setErrors({ name: "", balance: "" });
      setIsSubmitting(false);
    }
  }, [isOpen, accountToEdit, defaultIsDebt]);

  const validateInputs = (): boolean => {
    const newErrors = {
      name: "",
      balance: "",
    };

    // Validate name
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    // Validate balance
    if (!balance.trim()) {
      newErrors.balance = "Balance is required";
    } else if (!isValidNumber(balance)) {
      newErrors.balance = "Balance must be a valid number";
    }

    setErrors(newErrors);
    setTouched({ name: true, balance: true });

    // Return true if no errors
    return !newErrors.name && !newErrors.balance;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!validateInputs()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize and convert balance to number
      let numericBalance = sanitizeNumber(balance);

      // For liability accounts, ensure the balance is negative
      if (isDebt && numericBalance > 0) {
        numericBalance = -numericBalance;
      }

      // Sanitize name input
      const sanitizedName = sanitizeString(name);

      const accountData = {
        name: sanitizedName,
        type,
        balance: numericBalance,
        isDebt,
        currency,
      };

      if (accountToEdit) {
        await onUpdateAccount({ ...accountData, id: accountToEdit.id });
      } else {
        await onAddAccount(accountData);
      }

      // Close dialog after successful submission
      onClose();
    } catch (error) {
      console.error("Error submitting account:", error);
      setIsSubmitting(false);
    }
  };

  const handleDebtToggle = (checked: boolean) => {
    if (!accountToEdit) {
      setIsDebt(checked);
      setType(checked ? debtTypes[0] : assetTypes[0]);
    }
  };

  const isNameError = touched.name && errors.name;
  const isBalanceError = touched.balance && errors.balance;

  // Get available account types based on whether it's an asset or liability
  const availableTypes = isDebt ? debtTypes : assetTypes;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
              aria-invalid={!!isNameError}
            />
            {isNameError && (
              <p className="text-sm text-destructive">{errors.name}</p>
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
              aria-invalid={!!isBalanceError}
            />
            {isBalanceError && (
              <p className="text-sm text-destructive">{errors.balance}</p>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : accountToEdit ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
