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
  type ExpenseGroupSummary,
} from "@/lib/expense-groups/client";
import { useExpenseGroups } from "./expense-group-context";

type Props = {
  group: ExpenseGroupSummary | null;
  onOpenChange: (open: boolean) => void;
};

export function ExpenseGroupDeleteDialog({ group, onOpenChange }: Props) {
  const { removeGroup } = useExpenseGroups();
  const [pending, startTransition] = useTransition();
  const open = !!group;

  function handleConfirm() {
    if (!group || pending) return;
    startTransition(async () => {
      try {
        await expenseGroupClient.remove(group.id);
        removeGroup(group.id);
        toast.success(`Deleted “${group.name}”`);
        onOpenChange(false);
      } catch (err) {
        const message =
          err instanceof ExpenseGroupError || err instanceof Error
            ? err.message
            : "Failed to delete group";
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
          <AlertDialogTitle>Delete expense group?</AlertDialogTitle>
          <AlertDialogDescription>
            {group ? (
              <>
                This permanently removes <b>{group.name}</b> and revokes access
                for everyone in it. This action cannot be undone.
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
