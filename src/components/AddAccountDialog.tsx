import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Account, AssetType, DebtType } from "./AccountsList";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AddAccountDialogProps {
  onAddAccount: (account: Omit<Account, "id">) => void;
  onEditAccount?: (account: Account) => void;
  account?: Account;
  trigger?: React.ReactNode;
  className?: string;
}

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
] as const;

type Currency = (typeof CURRENCIES)[number]["code"];

const assetTypes: AssetType[] = [
  "Checking",
  "Savings",
  "Brokerage",
  "Retirement",
  "401K",
  "Car",
  "Real Estate",
];

const debtTypes: DebtType[] = ["Credit Card", "Loan", "Mortgage"];

export function AddAccountDialog({
  onAddAccount,
  onEditAccount,
  account,
  trigger,
  className,
}: AddAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType | DebtType>("Checking");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [isDebt, setIsDebt] = useState(false);

  // Reset form when dialog opens and when account changes
  useEffect(() => {
    if (open) {
      if (account) {
        setName(account.name);
        setType(account.type);
        setBalance(Math.abs(account.balance).toString());
        setCurrency(account.currency);
        setIsDebt(account.isDebt ?? false);
      } else {
        setName("");
        setType("Checking");
        setBalance("");
        setCurrency("USD");
        setIsDebt(false);
      }
      setTouched({ name: false, balance: false });
    }
  }, [open, account]);

  const [touched, setTouched] = useState({
    name: false,
    balance: false,
  });

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

    if (account && onEditAccount) {
      onEditAccount({ ...accountData, id: account.id });
    } else {
      onAddAccount(accountData);
    }

    setOpen(false);
    setName("");
    setType("Checking");
    setBalance("0");
    setCurrency("USD");
    setIsDebt(false);
    setTouched({ name: false, balance: false });
  };

  const handleDebtToggle = (checked: boolean) => {
    if (!account) {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline" className={className}>Add Account</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {account ? "Edit Account" : "Add New Account"}
          </DialogTitle>
          <DialogDescription>
            {account ? "Edit" : "Add a new"} {isDebt ? "liability" : "asset"}{" "}
            account to track your net worth.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="debt-mode"
              checked={isDebt}
              onCheckedChange={handleDebtToggle}
              disabled={!!account}
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
              onValueChange={(value) => setType(value as AssetType | DebtType)}
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
              onValueChange={(value) => setCurrency(value as Currency)}
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
            {account ? "Save Changes" : "Add Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
