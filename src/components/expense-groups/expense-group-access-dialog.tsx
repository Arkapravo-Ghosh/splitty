"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  PencilSimpleIcon,
  SignOutIcon,
  TrashIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import {
  currencyClient,
  expenseGroupClient,
  ExpenseGroupError,
  type CurrencyOption,
  type ExpenseGroupMemberSummary,
  type ExpenseGroupSummary,
} from "@/lib/expense-groups/client";
import { useExpenseGroups } from "./expense-group-context";
import { ExpenseGroupDeleteDialog } from "./expense-group-delete-dialog";
import { ExpenseGroupLeaveDialog } from "./expense-group-leave-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExpenseGroupAccessDialog({ open, onOpenChange }: Props) {
  const { activeGroup, currentUser, upsertGroup } = useExpenseGroups();
  const [members, setMembers] = useState<ExpenseGroupMemberSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [adding, startAdding] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, startRenaming] = useTransition();
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [changingCurrency, startChangingCurrency] = useTransition();
  const [togglingLock, startTogglingLock] = useTransition();
  const [pendingDelete, setPendingDelete] =
    useState<ExpenseGroupSummary | null>(null);
  const [pendingLeave, setPendingLeave] =
    useState<ExpenseGroupSummary | null>(null);

  const isOwner = !!activeGroup?.isOwner;
  const groupId = activeGroup?.id ?? null;
  const activeName = activeGroup?.name ?? "";
  const activeCurrency = activeGroup?.currencyCode ?? "INR";
  const activeLocked = !!activeGroup?.locked;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRenameValue(activeName);
  }, [activeName, open]);

  const load = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const { members } = await expenseGroupClient.listMembers(id);
        setMembers(members);
      } catch (err) {
        const message =
          err instanceof ExpenseGroupError || err instanceof Error
            ? err.message
            : "Failed to load members";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open || !groupId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(groupId);
  }, [open, groupId, load]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const { currencies } = await currencyClient.list();
        if (!cancelled) setCurrencies(currencies);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load currencies";
        toast.error(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function handleLockedChange(next: boolean) {
    if (!groupId || next === activeLocked) return;
    startTogglingLock(async () => {
      try {
        const { group } = await expenseGroupClient.setLocked(groupId, next);
        upsertGroup(group);
        toast.success(group.locked ? "Group locked" : "Group unlocked");
      } catch (err) {
        const message =
          err instanceof ExpenseGroupError || err instanceof Error
            ? err.message
            : "Failed to update group";
        toast.error(message);
      }
    });
  }

  function handleCurrencyChange(code: string) {
    if (!groupId || code === activeCurrency) return;
    startChangingCurrency(async () => {
      try {
        const { group } = await expenseGroupClient.setCurrency(groupId, code);
        upsertGroup(group);
        toast.success(`Currency set to ${group.currencyCode}`);
      } catch (err) {
        const message =
          err instanceof ExpenseGroupError || err instanceof Error
            ? err.message
            : "Failed to change currency";
        toast.error(message);
      }
    });
  }

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupId) return;
    const trimmed = email.trim();
    if (!trimmed) return;
    startAdding(async () => {
      try {
        const { member } = await expenseGroupClient.addMember(groupId, trimmed);
        setMembers((prev) => {
          const without = prev.filter((m) => m.userId !== member.userId);
          return [...without, member];
        });
        toast.success(`Granted access to ${member.email}`);
        setEmail("");
      } catch (err) {
        const message =
          err instanceof ExpenseGroupError || err instanceof Error
            ? err.message
            : "Failed to add member";
        toast.error(message);
      }
    });
  }

  function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupId) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === activeName) return;
    startRenaming(async () => {
      try {
        const { group } = await expenseGroupClient.rename(groupId, trimmed);
        upsertGroup(group);
        toast.success("Group renamed");
      } catch (err) {
        const message =
          err instanceof ExpenseGroupError || err instanceof Error
            ? err.message
            : "Failed to rename group";
        toast.error(message);
      }
    });
  }

  async function handleRevoke(userId: string) {
    if (!groupId) return;
    setRevokingId(userId);
    try {
      await expenseGroupClient.revokeMember(groupId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success("Access revoked");
    } catch (err) {
      const message =
        err instanceof ExpenseGroupError || err instanceof Error
          ? err.message
          : "Failed to revoke access";
      toast.error(message);
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader>
          <DialogTitle>Manage access</DialogTitle>
          <DialogDescription>
            {activeGroup
              ? `Members who can see “${activeGroup.name}”.`
              : "No expense group selected."}
          </DialogDescription>
        </DialogHeader>

        {isOwner ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <Label htmlFor="expense-group-locked">Lock group</Label>
                <span className="text-xs text-muted-foreground">
                  When on, no new expenses can be added.
                </span>
              </div>
              <Switch
                id="expense-group-locked"
                checked={activeLocked}
                disabled={togglingLock || !groupId}
                onCheckedChange={handleLockedChange}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="expense-group-currency" className="shrink-0">
                Currency
              </Label>
              <Select
                value={activeCurrency}
                disabled={changingCurrency || !groupId}
                onValueChange={(v) => v && handleCurrencyChange(v)}
              >
                <SelectTrigger
                  id="expense-group-currency"
                  className="w-full"
                >
                  <SelectValue>
                    {(value: string | null) => {
                      const code = value ?? activeCurrency;
                      const c = currencies.find((c) => c.code === code);
                      if (!c) return code;
                      return `${c.symbol} ${c.code} — ${c.name}`;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currencies.length === 0 ? (
                    <SelectItem value={activeCurrency}>
                      {activeCurrency}
                    </SelectItem>
                  ) : (
                    currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code} — {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {changingCurrency ? <Spinner /> : null}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={handleRename}
            >
              <Input
                placeholder="Group name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.currentTarget.value)}
                disabled={renaming || !groupId}
                maxLength={80}
                required
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={
                  renaming ||
                  !renameValue.trim() ||
                  renameValue.trim() === activeName ||
                  !groupId
                }
              >
                {renaming ? <Spinner /> : <PencilSimpleIcon />}
                Rename
              </Button>
            </form>
            <form className="flex items-center gap-2" onSubmit={handleAdd}>
              <Input
                type="email"
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                disabled={adding || !groupId}
                required
              />
              <Button
                type="submit"
                size="sm"
                disabled={adding || !email.trim() || !groupId}
              >
                {adding ? <Spinner /> : <UserPlusIcon />}
                Add
              </Button>
            </form>
          </>
        ) : activeGroup ? (
          <p className="text-xs text-muted-foreground">
            Only the owner can rename this group or change who has access.
          </p>
        ) : null}

        {isOwner && activeGroup ? (
          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">
                Delete group
              </span>
              <span className="text-xs text-muted-foreground">
                Permanently removes the group for everyone.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingDelete(activeGroup)}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/50"
            >
              <TrashIcon />
              Delete
            </Button>
          </div>
        ) : null}

        {!isOwner && activeGroup && currentUser ? (
          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">
                Leave group
              </span>
              <span className="text-xs text-muted-foreground">
                Your past expenses stay so the owner can clean up.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingLeave(activeGroup)}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/50"
            >
              <SignOutIcon />
              Leave
            </Button>
          </div>
        ) : null}

        <div className="-mx-1 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
              <Spinner className="me-2" /> Loading…
            </div>
          ) : members.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs text-muted-foreground">
              No members yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {members.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center gap-3 px-1 py-2"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xs font-medium text-foreground">
                      {member.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </span>
                  </div>
                  <div className="ms-auto flex items-center gap-2">
                    {member.isOwner ? (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Owner
                      </span>
                    ) : isOwner ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Revoke access for ${member.email}`}
                        disabled={revokingId === member.userId}
                        onClick={() => handleRevoke(member.userId)}
                      >
                        {revokingId === member.userId ? (
                          <Spinner />
                        ) : (
                          <TrashIcon />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
      <ExpenseGroupDeleteDialog
        group={pendingDelete}
        onDeleted={() => {
          setPendingDelete(null);
          onOpenChange(false);
        }}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      />
      <ExpenseGroupLeaveDialog
        group={pendingLeave}
        userId={currentUser?.id ?? null}
        onLeft={() => {
          setPendingLeave(null);
          onOpenChange(false);
        }}
        onOpenChange={(next) => {
          if (!next) setPendingLeave(null);
        }}
      />
    </Dialog>
  );
}
