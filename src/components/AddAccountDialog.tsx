import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

interface AddAccountDialogProps {
  onAddAccount: (account: Omit<Account, 'id'>) => void;
}

export function AddAccountDialog({ onAddAccount }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("Checking");
  const [balance, setBalance] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAccount({
      name,
      type,
      balance: parseFloat(balance) || 0,
    });
    setOpen(false);
    setName("");
    setType("Checking");
    setBalance("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Account</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Account Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="type" className="text-sm font-medium">
              Account Type
            </label>
            <Select value={type} onValueChange={(value) => setType(value as AccountType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Checking">Checking</SelectItem>
                <SelectItem value="Savings">Savings</SelectItem>
                <SelectItem value="Brokerage">Brokerage</SelectItem>
                <SelectItem value="Retirement">Retirement</SelectItem>
                <SelectItem value="401K">401K</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="balance" className="text-sm font-medium">
              Balance
            </label>
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