"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CheckIcon } from "@phosphor-icons/react";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  expenseGroupClient,
  ExpenseGroupError,
  type ExpenseGroupMemberSummary,
  type ExpenseRow,
} from "@/lib/expense-groups/client";
import { useExpenseGroups } from "./expense-group-context";
import { MemberPicker } from "./member-picker";

type Props = {
  expense: ExpenseRow | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (expense: ExpenseRow) => void;
};

export function EditExpenseDialog({ expense, onOpenChange, onUpdated }: Props) {
  const { activeGroup, currentUser } = useExpenseGroups();
  const [members, setMembers] = useState<ExpenseGroupMemberSummary[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [paidById, setPaidById] = useState<string>("");
  const [submitting, startSubmitting] = useTransition();

  const groupId = activeGroup?.id ?? null;
  const symbol = activeGroup?.currencySymbol ?? "";
  const open = !!expense;

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
    if (!expense) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAmount(expense.amount);
    setDetails(expense.details ?? "");
    setPaidById(expense.paidBy.id);
  }, [expense]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupId || !expense) return;
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }
    if (!paidById) {
      toast.error("Pick who paid");
      return;
    }

    const trimmedDetails = details.trim();
    const detailsValue = trimmedDetails || null;

    const patch: {
      amount?: number;
      details?: string | null;
      paidByUserId?: string;
    } = {};
    if (parsed.toFixed(2) !== expense.amount) patch.amount = parsed;
    if (detailsValue !== (expense.details ?? null))
      patch.details = detailsValue;
    if (paidById !== expense.paidBy.id) patch.paidByUserId = paidById;

    if (Object.keys(patch).length === 0) {
      onOpenChange(false);
      return;
    }

    startSubmitting(async () => {
      try {
        const { expense: updated } = await expenseGroupClient.updateExpense(
          groupId,
          expense.id,
          patch,
        );
        onUpdated(updated);
        toast.success("Expense updated");
        onOpenChange(false);
      } catch (err) {
        const message =
          err instanceof ExpenseGroupError || err instanceof Error
            ? err.message
            : "Failed to update expense";
        toast.error(message);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
    >
      <DialogContent className="sm:max-w-sm gap-4">
        <DialogHeader>
          <DialogTitle>Edit expense</DialogTitle>
          <DialogDescription>
            {activeGroup
              ? `Update this expense in “${activeGroup.name}”.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-expense-amount">Amount</Label>
            <InputGroup>
              <InputGroupAddon className="border-r border-input bg-muted px-2.5 text-foreground">
                {symbol}
              </InputGroupAddon>
              <InputGroupInput
                id="edit-expense-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.currentTarget.value)}
                disabled={submitting}
                required
              />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-expense-details">Expense details</Label>
            <Input
              id="edit-expense-details"
              type="text"
              value={details}
              onChange={(e) => setDetails(e.currentTarget.value)}
              maxLength={200}
              disabled={submitting}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-expense-paid-by">Paid by</Label>
            <MemberPicker
              id="edit-expense-paid-by"
              value={paidById}
              onValueChange={setPaidById}
              members={members}
              currentUserId={currentUser?.id ?? null}
              disabled={submitting || loadingMembers}
            />
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
              disabled={submitting || !amount.trim() || !paidById || !groupId}
            >
              {submitting ? <Spinner /> : <CheckIcon />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
