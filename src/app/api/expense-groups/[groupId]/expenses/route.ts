import { NextResponse } from "next/server";
import { aliasedTable, and, desc, eq, or } from "drizzle-orm";

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

async function assertAccess(groupId: string, userId: string) {
  const [row] = await db
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
  return row ?? null;
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { groupId } = await ctx.params;
  if (!UUID_RE.test(groupId)) {
    return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
  }
  const access = await assertAccess(groupId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const addedBy = aliasedTable(users, "added_by");
  const paidBy = aliasedTable(users, "paid_by");

  const rows = await db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      details: expenses.details,
      createdAt: expenses.createdAt,
      addedByUserId: expenses.addedByUserId,
      addedByName: addedBy.name,
      addedByEmail: addedBy.email,
      paidByUserId: expenses.paidByUserId,
      paidByName: paidBy.name,
      paidByEmail: paidBy.email,
    })
    .from(expenses)
    .innerJoin(addedBy, eq(addedBy.id, expenses.addedByUserId))
    .innerJoin(paidBy, eq(paidBy.id, expenses.paidByUserId))
    .where(eq(expenses.groupId, groupId))
    .orderBy(desc(expenses.createdAt));

  return NextResponse.json({
    expenses: rows.map((row) => ({
      id: row.id,
      amount: row.amount,
      details: row.details,
      createdAt: row.createdAt,
      addedBy: {
        id: row.addedByUserId,
        name: row.addedByName,
        email: row.addedByEmail,
      },
      paidBy: {
        id: row.paidByUserId,
        name: row.paidByName,
        email: row.paidByEmail,
      },
    })),
  });
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { groupId } = await ctx.params;
  if (!UUID_RE.test(groupId)) {
    return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
  }
  const access = await assertAccess(groupId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (access.locked) {
    return NextResponse.json(
      { error: "Group is locked and not accepting new expenses" },
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
  const { paidByUserId, addedByUserId, amount, details } = body as Record<
    string,
    unknown
  >;

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
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
  let detailsValue: string | null = null;
  if (details !== undefined && details !== null) {
    if (typeof details !== "string") {
      return NextResponse.json(
        { error: "Details must be a string" },
        { status: 400 },
      );
    }
    const trimmed = details.trim();
    if (trimmed.length > 200) {
      return NextResponse.json(
        { error: "Details must be 200 characters or fewer" },
        { status: 400 },
      );
    }
    detailsValue = trimmed || null;
  }
  const paidById =
    typeof paidByUserId === "string" && UUID_RE.test(paidByUserId)
      ? paidByUserId
      : session.user.id;
  const addedById =
    typeof addedByUserId === "string" && UUID_RE.test(addedByUserId)
      ? addedByUserId
      : session.user.id;

  // Both users must be members of (or own) the group.
  const memberRows = await db
    .select({ userId: expenseGroupMembers.userId })
    .from(expenseGroupMembers)
    .where(eq(expenseGroupMembers.groupId, groupId));
  const validSet = new Set<string>(memberRows.map((r) => r.userId));
  validSet.add(access.ownerId);
  if (!validSet.has(paidById) || !validSet.has(addedById)) {
    return NextResponse.json(
      { error: "Both users must have access to this group" },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(expenses)
    .values({
      groupId,
      addedByUserId: addedById,
      paidByUserId: paidById,
      amount: amount.toFixed(2),
      details: detailsValue,
    })
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
        eq(users.id, created.addedByUserId),
        eq(users.id, created.paidByUserId),
      ),
    );
  const byId = new Map(principals.map((u) => [u.id, u]));
  const addedByUser = byId.get(created.addedByUserId);
  const paidByUser = byId.get(created.paidByUserId);

  return NextResponse.json({
    expense: {
      id: created.id,
      amount: created.amount,
      details: created.details,
      createdAt: created.createdAt,
      addedBy: addedByUser
        ? {
            id: addedByUser.id,
            name: addedByUser.name,
            email: addedByUser.email,
          }
        : { id: created.addedByUserId, name: "", email: "" },
      paidBy: paidByUser
        ? {
            id: paidByUser.id,
            name: paidByUser.name,
            email: paidByUser.email,
          }
        : { id: created.paidByUserId, name: "", email: "" },
    },
  });
}
