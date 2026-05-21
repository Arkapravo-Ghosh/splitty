"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  expenseGroupClient,
  ExpenseGroupError,
  type SettlementsResponse,
  type SettlementRow,
} from "@/lib/expense-groups/client";
import { useExpenseGroups } from "./expense-group-context";

function formatAmount(amount: number, symbol: string) {
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function SettlementView({ groupId }: { groupId: string }) {
  const { currentUser, refresh: refreshGroups } = useExpenseGroups();
  const [data, setData] = useState<SettlementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [refreshing, startRefreshing] = useTransition();
  const [mineOnly, setMineOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await expenseGroupClient.listSettlements(groupId);
      setData(result);
    } catch (err) {
      const message =
        err instanceof ExpenseGroupError || err instanceof Error
          ? err.message
          : "Failed to load settlements";
      toast.error(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function handleRefresh() {
    startRefreshing(async () => {
      await Promise.all([refreshGroups(), load()]);
    });
  }

  async function togglePaid(row: SettlementRow, next: boolean) {
    if (!data) return;
    const key = `${row.fromUserId}|${row.toUserId}`;
    setUpdatingKey(key);
    // Optimistic update
    const previous = data;
    setData({
      ...data,
      settlements: data.settlements.map((s) =>
        s.fromUserId === row.fromUserId && s.toUserId === row.toUserId
          ? { ...s, paid: next }
          : s,
      ),
    });
    try {
      await expenseGroupClient.setSettlementPaid(groupId, {
        fromUserId: row.fromUserId,
        toUserId: row.toUserId,
        paid: next,
      });
    } catch (err) {
      setData(previous);
      const message =
        err instanceof ExpenseGroupError || err instanceof Error
          ? err.message
          : "Failed to update settlement";
      toast.error(message);
    } finally {
      setUpdatingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-xs text-muted-foreground">
        <Spinner /> Computing splits…
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-10 text-xs text-muted-foreground">
        Couldn&apos;t load settlements.
      </p>
    );
  }

  const symbol = data.group.currencySymbol || "";
  const myId = currentUser?.id ?? null;
  const involvesMe = (row: SettlementRow) =>
    !!myId && (row.fromUserId === myId || row.toUserId === myId);
  const visibleSettlements =
    mineOnly && myId
      ? data.settlements.filter(involvesMe)
      : data.settlements;
  const canFilter = !!myId && data.settlements.some(involvesMe);

  return (
    <section className="flex w-full max-w-3xl flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Settle up — {data.group.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            Total {formatAmount(data.totalExpense, symbol)} across{" "}
            {data.memberCount}{" "}
            {data.memberCount === 1 ? "member" : "members"}. Each
            member&apos;s share is{" "}
            {formatAmount(data.perMemberShare, symbol)}.
          </p>
        </div>
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
      </header>

      {data.settlements.length === 0 ? (
        <p className="py-10 text-center text-xs text-muted-foreground">
          Everyone&apos;s squared up — no settlements needed.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-end gap-2">
            <Label
              htmlFor="settlement-mine-only"
              className="text-xs text-muted-foreground"
            >
              Only my dues
            </Label>
            <Switch
              id="settlement-mine-only"
              checked={mineOnly}
              disabled={!canFilter}
              onCheckedChange={setMineOnly}
            />
          </div>
          <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-20 text-center">Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSettlements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-xs text-muted-foreground"
                  >
                    No settlements involve you.
                  </TableCell>
                </TableRow>
              ) : null}
              {visibleSettlements.map((row) => {
                const key = `${row.fromUserId}|${row.toUserId}`;
                const isRecipient = currentUser?.id === row.toUserId;
                const isUpdating = updatingKey === key;
                return (
                  <TableRow key={key}>
                    <TableCell>
                      <div className="flex flex-col leading-tight">
                        <span>{row.fromName}</span>
                        <span className="truncate text-muted-foreground">
                          {row.fromEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col leading-tight">
                        <span>{row.toName}</span>
                        <span className="truncate text-muted-foreground">
                          {row.toEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(row.amount, symbol)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        {isUpdating ? (
                          <Spinner className="size-3.5" />
                        ) : (
                          <Checkbox
                            checked={row.paid}
                            disabled={!isRecipient}
                            aria-label={
                              isRecipient
                                ? "Mark as paid"
                                : `Paid status (controlled by ${row.toName})`
                            }
                            onCheckedChange={(next) =>
                              isRecipient && togglePaid(row, next)
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        </>
      )}
    </section>
  );
}
