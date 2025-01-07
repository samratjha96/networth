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
import { useState } from "react";
import { Account, AccountType } from "./AccountsList";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AddAccountDialogProps {
  onAddAccount: (account: Omit<Account, "id">) => void;
}

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
] as const;

type Currency = typeof CURRENCIES[number]["code"];

export function AddAccountDialog({ onAddAccount }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("Checking");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [isDebt, setIsDebt] = useState(false);
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

    onAddAccount({
      name,
      type,
      balance: parseFloat(balance) || 0,
      isDebt,
      currency,
    });
    setOpen(false);
    setName("");
    setType("Checking");
    setBalance("");
    setCurrency("USD");
    setIsDebt(false);
    setTouched({ name: false, balance: false });
  };

  const assetTypes: AccountType[] = [
    "Checking",
    "Savings",
    "Brokerage",
    "Retirement",
    "401K",
  ];
  const debtTypes: AccountType[] = ["Credit Card", "Loan", "Mortgage", "Car"];

  const isNameError = touched.name && !name.trim();
  const isBalanceError = touched.balance && !balance.trim();
  const isValid = name.trim() && balance.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Account</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Add a new asset or debt account to track your net worth.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="debt-mode"
              checked={isDebt}
              onCheckedChange={setIsDebt}
            />
            <Label htmlFor="debt-mode">This is a debt</Label>
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
              onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
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
                {isDebt
                  ? debtTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))
                  : assetTypes.map((type) => (
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
              onBlur={() => setTouched(prev => ({ ...prev, balance: true }))}
              className={`col-span-3 bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.1)] focus-visible:shadow-[0_0_0_1px_hsl(var(--primary))] ${
                isBalanceError ? "shadow-[0_0_0_1px_hsl(var(--destructive))]" : ""
              }`}
              aria-invalid={isBalanceError}
            />
            {isBalanceError && (
              <p className="text-sm text-destructive">Balance is required</p>
            )}
          </div>

          <Button type="submit" disabled={!isValid}>Add Account</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
