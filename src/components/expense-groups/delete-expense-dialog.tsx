"use client";

import { useTransition } from "react";
import { TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  expenseGroupClient,
  ExpenseGroupError,
  type ExpenseRow,
} from "@/lib/expense-groups/client";

type Props = {
  expense: ExpenseRow | null;
  groupId: string | null;
  symbol: string;
  onOpenChange: (open: boolean) => void;
  onDeleted: (expenseId: string) => void;
};

export function DeleteExpenseDialog({
  expense,
  groupId,
  symbol,
  onOpenChange,
  onDeleted,
}: Props) {
  const [pending, startTransition] = useTransition();
  const open = !!expense;

  function handleConfirm() {
    if (!expense || !groupId || pending) return;
    startTransition(async () => {
      try {
        await expenseGroupClient.removeExpense(groupId, expense.id);
        onDeleted(expense.id);
        toast.success("Expense deleted");
        onOpenChange(false);
      } catch (err) {
        const message =
          err instanceof ExpenseGroupError || err instanceof Error
            ? err.message
            : "Failed to delete expense";
        toast.error(message);
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete expense?</AlertDialogTitle>
          <AlertDialogDescription>
            {expense ? (
              <>
                Permanently removes this entry
                {expense.details ? ` (“${expense.details}”) ` : " "}
                of {symbol}
                {Number.parseFloat(expense.amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                . Settlement amounts will recalculate. This cannot be undone.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending ? <Spinner /> : <TrashIcon />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
