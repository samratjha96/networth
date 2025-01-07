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
  onAddAccount: (account: Omit<Account, 'id'>) => void;
}

export function AddAccountDialog({ onAddAccount }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("Checking");
  const [balance, setBalance] = useState("");
  const [isDebt, setIsDebt] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAccount({
      name,
      type,
      balance: parseFloat(balance) || 0,
      isDebt,
    });
    setOpen(false);
    setName("");
    setType("Checking");
    setBalance("");
    setIsDebt(false);
  };

  const assetTypes: AccountType[] = ["Checking", "Savings", "Brokerage", "Retirement", "401K"];
  const debtTypes: AccountType[] = ["Credit Card", "Loan", "Mortgage"];

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
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="type">Account Type</Label>
            <Select 
              value={type} 
              onValueChange={(value) => setType(value as AccountType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {isDebt ? (
                  debtTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))
                ) : (
                  assetTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="balance">Balance</Label>
            <Input
              id="balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <Button type="submit">Add Account</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}