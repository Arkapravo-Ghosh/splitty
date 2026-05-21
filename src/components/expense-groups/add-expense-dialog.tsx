"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { PlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  expenseGroupClient,
  ExpenseGroupError,
  type ExpenseGroupMemberSummary,
  type ExpenseRow,
} from "@/lib/expense-groups/client";
import { useExpenseGroups } from "./expense-group-context";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (expense: ExpenseRow) => void;
};

export function AddExpenseDialog({ open, onOpenChange, onCreated }: Props) {
  const { activeGroup, currentUser } = useExpenseGroups();
  const [members, setMembers] = useState<ExpenseGroupMemberSummary[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [paidById, setPaidById] = useState<string>("");
  const [submitting, startSubmitting] = useTransition();

  const groupId = activeGroup?.id ?? null;
  const symbol = activeGroup?.currencySymbol ?? "";

  const loadMembers = useCallback(async (id: string) => {
    setLoadingMembers(true);
    try {
      const { members } = await expenseGroupClient.listMembers(id);
      setMembers(members);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load members";
      toast.error(message);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !groupId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMembers(groupId);
  }, [open, groupId, loadMembers]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAmount("");
    setDetails("");
    setPaidById(currentUser?.id ?? "");
  }, [open, currentUser?.id]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupId || !currentUser) return;
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }
    if (!paidById) {
      toast.error("Pick who paid");
      return;
    }
    startSubmitting(async () => {
      try {
        const { expense } = await expenseGroupClient.addExpense(groupId, {
          amount: parsed,
          paidByUserId: paidById,
          addedByUserId: currentUser.id,
          details: details.trim() || null,
        });
        onCreated(expense);
        toast.success("Expense added");
        onOpenChange(false);
      } catch (err) {
        const message =
          err instanceof ExpenseGroupError || err instanceof Error
            ? err.message
            : "Failed to add expense";
        toast.error(message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm gap-4">
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
          <DialogDescription>
            {activeGroup
              ? `Record an expense for “${activeGroup.name}”.`
              : "No expense group selected."}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expense-amount">Amount</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{symbol}</span>
              <Input
                id="expense-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.currentTarget.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expense-details">Expense details</Label>
            <Input
              id="expense-details"
              type="text"
              placeholder="e.g. Dinner on 28th"
              value={details}
              onChange={(e) => setDetails(e.currentTarget.value)}
              maxLength={200}
              disabled={submitting}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expense-paid-by">Paid by</Label>
            <Select
              value={paidById}
              disabled={submitting || loadingMembers || members.length === 0}
              onValueChange={(v) => setPaidById(v ?? "")}
            >
              <SelectTrigger id="expense-paid-by" className="w-full">
                <SelectValue placeholder="Select a member">
                  {(value: string | null) => {
                    if (!value) return "Select a member";
                    const m = members.find((m) => m.userId === value);
                    if (!m) return "Select a member";
                    return `${m.name}${currentUser?.id === m.userId ? " (you)" : ""}`;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.name}
                    {currentUser?.id === m.userId ? " (you)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                submitting ||
                !amount.trim() ||
                !paidById ||
                !groupId
              }
            >
              {submitting ? <Spinner /> : <PlusIcon />}
              Add expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
