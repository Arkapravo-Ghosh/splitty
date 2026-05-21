import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";

import { db } from "@/db";
import {
  expenseGroupMembers,
  expenseGroups,
  expenses,
  users,
} from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadContext(
  groupId: string,
  expenseId: string,
  userId: string,
) {
  const [group] = await db
    .select({
      id: expenseGroups.id,
      ownerId: expenseGroups.ownerId,
      locked: expenseGroups.locked,
    })
    .from(expenseGroups)
    .leftJoin(
      expenseGroupMembers,
      and(
        eq(expenseGroupMembers.groupId, expenseGroups.id),
        eq(expenseGroupMembers.userId, userId),
      ),
    )
    .where(
      and(
        eq(expenseGroups.id, groupId),
        or(
          eq(expenseGroups.ownerId, userId),
          eq(expenseGroupMembers.userId, userId),
        ),
      ),
    )
    .limit(1);
  if (!group) return null;

  const [expense] = await db
    .select({
      id: expenses.id,
      addedByUserId: expenses.addedByUserId,
      paidByUserId: expenses.paidByUserId,
    })
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)))
    .limit(1);
  if (!expense) return null;

  return { group, expense };
}

function canModify(
  expense: { addedByUserId: string; paidByUserId: string },
  userId: string,
) {
  return (
    expense.addedByUserId === userId || expense.paidByUserId === userId
  );
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ groupId: string; expenseId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { groupId, expenseId } = await ctx.params;
  if (!UUID_RE.test(groupId) || !UUID_RE.test(expenseId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const loaded = await loadContext(groupId, expenseId, session.user.id);
  if (!loaded) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canModify(loaded.expense, session.user.id)) {
    return NextResponse.json(
      { error: "Only the person who added or paid can edit this expense" },
      { status: 403 },
    );
  }
  if (loaded.group.locked) {
    return NextResponse.json(
      { error: "Group is locked" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { amount, details, paidByUserId } = body as Record<string, unknown>;

  const patch: {
    amount?: string;
    details?: string | null;
    paidByUserId?: string;
  } = {};

  if (amount !== undefined) {
    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }
    if (amount > 9999999999) {
      return NextResponse.json(
        { error: "Amount is too large" },
        { status: 400 },
      );
    }
    patch.amount = amount.toFixed(2);
  }
  if (details !== undefined) {
    if (details === null) {
      patch.details = null;
    } else if (typeof details === "string") {
      const trimmed = details.trim();
      if (trimmed.length > 200) {
        return NextResponse.json(
          { error: "Details must be 200 characters or fewer" },
          { status: 400 },
        );
      }
      patch.details = trimmed || null;
    } else {
      return NextResponse.json(
        { error: "Details must be a string" },
        { status: 400 },
      );
    }
  }
  if (paidByUserId !== undefined) {
    if (typeof paidByUserId !== "string" || !UUID_RE.test(paidByUserId)) {
      return NextResponse.json(
        { error: "Invalid paidByUserId" },
        { status: 400 },
      );
    }
    // Validate the new payer has access to the group.
    const memberRows = await db
      .select({ userId: expenseGroupMembers.userId })
      .from(expenseGroupMembers)
      .where(eq(expenseGroupMembers.groupId, groupId));
    const valid = new Set<string>(memberRows.map((r) => r.userId));
    valid.add(loaded.group.ownerId);
    if (!valid.has(paidByUserId)) {
      return NextResponse.json(
        { error: "Payer must have access to this group" },
        { status: 400 },
      );
    }
    patch.paidByUserId = paidByUserId;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(expenses)
    .set(patch)
    .where(eq(expenses.id, expenseId))
    .returning({
      id: expenses.id,
      amount: expenses.amount,
      details: expenses.details,
      createdAt: expenses.createdAt,
      addedByUserId: expenses.addedByUserId,
      paidByUserId: expenses.paidByUserId,
    });

  const principals = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(
      or(
        eq(users.id, updated.addedByUserId),
        eq(users.id, updated.paidByUserId),
      ),
    );
  const byId = new Map(principals.map((u) => [u.id, u]));
  const addedByUser = byId.get(updated.addedByUserId);
  const paidByUser = byId.get(updated.paidByUserId);

  return NextResponse.json({
    expense: {
      id: updated.id,
      amount: updated.amount,
      details: updated.details,
      createdAt: updated.createdAt,
      addedBy: addedByUser
        ? {
            id: addedByUser.id,
            name: addedByUser.name,
            email: addedByUser.email,
          }
        : { id: updated.addedByUserId, name: "", email: "" },
      paidBy: paidByUser
        ? {
            id: paidByUser.id,
            name: paidByUser.name,
            email: paidByUser.email,
          }
        : { id: updated.paidByUserId, name: "", email: "" },
    },
  });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ groupId: string; expenseId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { groupId, expenseId } = await ctx.params;
  if (!UUID_RE.test(groupId) || !UUID_RE.test(expenseId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const loaded = await loadContext(groupId, expenseId, session.user.id);
  if (!loaded) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canModify(loaded.expense, session.user.id)) {
    return NextResponse.json(
      { error: "Only the person who added or paid can delete this expense" },
      { status: 403 },
    );
  }
  if (loaded.group.locked) {
    return NextResponse.json(
      { error: "Group is locked" },
      { status: 403 },
    );
  }

  await db.delete(expenses).where(eq(expenses.id, expenseId));
  return NextResponse.json({ ok: true });
}
