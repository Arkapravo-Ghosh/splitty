"use client";

import { useEffect, useState, useTransition } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import {
  expenseGroupClient,
  ExpenseGroupError,
} from "@/lib/expense-groups/client";
import { useExpenseGroups } from "./expense-group-context";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
};

export function ExpenseGroupCreateDialog({
  open,
  onOpenChange,
  initialName = "",
}: Props) {
  const { upsertGroup } = useExpenseGroups();
  const [name, setName] = useState(initialName);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(initialName);
    }
  }, [open, initialName]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    startTransition(async () => {
      try {
        const { group } = await expenseGroupClient.create({ name: trimmed });
        upsertGroup(group);
        toast.success(`Created “${group.name}”`);
        onOpenChange(false);
      } catch (err) {
        const message =
          err instanceof ExpenseGroupError || err instanceof Error
            ? err.message
            : "Failed to create group";
        toast.error(message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm gap-4">
        <DialogHeader>
          <DialogTitle>New expense group</DialogTitle>
          <DialogDescription>
            Give your group a name. You can rename it later.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expense-group-name">Name</Label>
            <Input
              id="expense-group-name"
              placeholder="Weekend trip, Apartment, Team lunches…"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              maxLength={80}
              autoFocus
              required
              disabled={pending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={pending || !name.trim()}
            >
              {pending ? <Spinner /> : <PlusIcon />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
