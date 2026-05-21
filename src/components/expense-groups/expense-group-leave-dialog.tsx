"use client";

import { useTransition } from "react";
import { SignOutIcon } from "@phosphor-icons/react";
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
  userId: string | null;
  onOpenChange: (open: boolean) => void;
  onLeft?: () => void;
};

export function ExpenseGroupLeaveDialog({
  group,
  userId,
  onOpenChange,
  onLeft,
}: Props) {
  const { removeGroup } = useExpenseGroups();
  const [pending, startTransition] = useTransition();
  const open = !!group && !!userId;

  function handleConfirm() {
    if (!group || !userId || pending) return;
    startTransition(async () => {
      try {
        await expenseGroupClient.leaveGroup(group.id, userId);
        removeGroup(group.id);
        toast.success(`You left “${group.name}”`);
        onLeft?.();
        onOpenChange(false);
      } catch (err) {
        const message =
          err instanceof ExpenseGroupError || err instanceof Error
            ? err.message
            : "Failed to leave group";
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
          <AlertDialogTitle>Leave this group?</AlertDialogTitle>
          <AlertDialogDescription>
            {group ? (
              <>
                You&apos;ll lose access to <b>{group.name}</b> and won&apos;t
                appear in its settlements. Your past expenses stay in the group
                — the owner can edit or delete them. If you&apos;re added back
                later, your expenses are linked to you again automatically.
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
            {pending ? <Spinner /> : <SignOutIcon />}
            Leave group
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
