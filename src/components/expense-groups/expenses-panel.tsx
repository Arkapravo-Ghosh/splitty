"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowsClockwiseIcon,
  CalculatorIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  expenseGroupClient,
  type ExpenseRow,
} from "@/lib/expense-groups/client";
import { useExpenseGroups } from "./expense-group-context";
import { AddExpenseDialog } from "./add-expense-dialog";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { DeleteExpenseDialog } from "./delete-expense-dialog";

function formatAmount(amount: string, symbol: string) {
  const n = Number.parseFloat(amount);
  if (!Number.isFinite(n)) return `${symbol}${amount}`;
  return `${symbol}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ordinalSuffix(day: number) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  let time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  // en-US uses non-breaking-ish spaces sometimes — normalize.
  time = time.replace(/ | /g, " ").toUpperCase();
  return {
    date: `${day}${ordinalSuffix(day)} ${month} ${year}`,
    time,
  };
}

export function ExpensesPanel() {
  const { activeGroup, currentUser, refresh: refreshGroups } =
    useExpenseGroups();
  const groupId = activeGroup?.id ?? null;
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [deleting, setDeleting] = useState<ExpenseRow | null>(null);
  const [refreshing, startRefreshing] = useTransition();

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { expenses } = await expenseGroupClient.listExpenses(id);
      setExpenses(expenses);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load expenses";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!groupId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpenses([]);
      return;
    }
    void load(groupId);
  }, [groupId, load]);

  function handleRefresh() {
    startRefreshing(async () => {
      await Promise.all([
        refreshGroups(),
        groupId ? load(groupId) : Promise.resolve(),
      ]);
    });
  }

  if (!activeGroup) return null;

  const symbol = activeGroup.currencySymbol || "";
  const hasRows = expenses.length > 0;
  const isLocked = activeGroup.locked;
  const total = expenses.reduce((sum, row) => {
    const n = Number.parseFloat(row.amount);
    return Number.isFinite(n) ? sum + n : sum;
  }, 0);

  return (
    <section className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-lg font-medium">
          {activeGroup.name}
          {isLocked ? (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Locked
            </span>
          ) : null}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Refresh"
            disabled={refreshing}
            onClick={handleRefresh}
          >
            <ArrowsClockwiseIcon
              className={refreshing ? "animate-spin" : undefined}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!groupId || !hasRows}
            nativeButton={false}
            render={<Link href={`/groups/${groupId}/settle`} />}
          >
            <CalculatorIcon />
            Settle up
          </Button>
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            disabled={!groupId || isLocked}
            title={isLocked ? "Group is locked" : undefined}
          >
            <PlusIcon />
            Add expense
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">
          <Spinner className="me-2" /> Loading expenses…
        </div>
      ) : hasRows ? (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Added</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Added by</TableHead>
                <TableHead>Paid by</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-20 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((row) => {
                const canActOn =
                  !!currentUser &&
                  !isLocked &&
                  (row.addedBy.id === currentUser.id ||
                    row.paidBy.id === currentUser.id);
                const dt = formatDateTime(row.createdAt);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {typeof dt === "string" ? (
                        dt
                      ) : (
                        <div className="flex flex-col leading-tight">
                          <span>{dt.date}</span>
                          <span className="text-muted-foreground">
                            {dt.time}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal wrap-break-word">
                      {row.details ? (
                        row.details
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col leading-tight">
                        <span>{row.addedBy.name}</span>
                        <span className="truncate text-muted-foreground">
                          {row.addedBy.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col leading-tight">
                        <span>{row.paidBy.name}</span>
                        <span className="truncate text-muted-foreground">
                          {row.paidBy.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(row.amount, symbol)}
                    </TableCell>
                    <TableCell className="text-center">
                      {canActOn ? (
                        <div className="-mx-1 flex items-center justify-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Edit expense"
                            onClick={() => setEditing(row)}
                          >
                            <PencilSimpleIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Delete expense"
                            onClick={() => setDeleting(row)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <TrashIcon />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(total.toFixed(2), symbol)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      ) : null}

      <AddExpenseDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(row) => setExpenses((prev) => [row, ...prev])}
      />
      <EditExpenseDialog
        expense={editing}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
        onUpdated={(updated) =>
          setExpenses((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r)),
          )
        }
      />
      <DeleteExpenseDialog
        expense={deleting}
        groupId={groupId}
        symbol={symbol}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        onDeleted={(id) =>
          setExpenses((prev) => prev.filter((r) => r.id !== id))
        }
      />
    </section>
  );
}
