import { NextResponse } from "next/server";
import { and, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  currencies,
  expenseGroupMembers,
  expenseGroups,
  expenses,
  settlements,
  users,
} from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { computeSettlements } from "@/lib/expense-groups/split";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadGroupForAccess(groupId: string, userId: string) {
  const [row] = await db
    .select({
      id: expenseGroups.id,
      ownerId: expenseGroups.ownerId,
      currencyCode: expenseGroups.currencyCode,
      currencySymbol: currencies.symbol,
      name: expenseGroups.name,
    })
    .from(expenseGroups)
    .innerJoin(currencies, eq(currencies.code, expenseGroups.currencyCode))
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
  const group = await loadGroupForAccess(groupId, session.user.id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Members of the group (including owner)
  const memberRows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
    })
    .from(expenseGroupMembers)
    .innerJoin(users, eq(users.id, expenseGroupMembers.userId))
    .where(eq(expenseGroupMembers.groupId, groupId));

  const memberMap = new Map(
    memberRows.map((m) => [m.userId, { name: m.name, email: m.email }]),
  );

  // Sum paid amounts per user
  const paidRows = await db
    .select({
      userId: expenses.paidByUserId,
      total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(eq(expenses.groupId, groupId))
    .groupBy(expenses.paidByUserId);

  const paidByUser = new Map<string, number>();
  for (const row of paidRows) {
    paidByUser.set(row.userId, Number.parseFloat(row.total));
  }

  // Ex-members who still have expenses attached remain in the split so the
  // math stays balanced. They're effectively frozen participants until the
  // owner cleans up their expenses or they rejoin.
  const orphanPayerIds = Array.from(paidByUser.keys()).filter(
    (id) => !memberMap.has(id),
  );
  if (orphanPayerIds.length > 0) {
    const orphanRows = await db
      .select({ userId: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.id, orphanPayerIds));
    for (const o of orphanRows) {
      memberMap.set(o.userId, { name: o.name, email: o.email });
    }
  }

  const allParticipants = Array.from(memberMap.keys());
  const splitMembers = allParticipants.map((id) => ({
    id,
    paid: paidByUser.get(id) ?? 0,
  }));
  const totalExpense = splitMembers.reduce((sum, m) => sum + m.paid, 0);
  const transfers = computeSettlements(splitMembers, totalExpense);

  // Existing paid flags
  const paidFlags = await db
    .select({
      fromUserId: settlements.fromUserId,
      toUserId: settlements.toUserId,
      paid: settlements.paid,
    })
    .from(settlements)
    .where(eq(settlements.groupId, groupId));

  const paidKey = (from: string, to: string) => `${from}|${to}`;
  const paidMap = new Map(
    paidFlags.map((p) => [paidKey(p.fromUserId, p.toUserId), p.paid]),
  );

  const enriched = transfers.map((t) => {
    const from = memberMap.get(t.fromUserId);
    const to = memberMap.get(t.toUserId);
    return {
      fromUserId: t.fromUserId,
      fromName: from?.name ?? "",
      fromEmail: from?.email ?? "",
      toUserId: t.toUserId,
      toName: to?.name ?? "",
      toEmail: to?.email ?? "",
      amount: t.amount,
      paid: paidMap.get(paidKey(t.fromUserId, t.toUserId)) ?? false,
    };
  });

  const participantCount = splitMembers.length;
  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      currencyCode: group.currencyCode,
      currencySymbol: group.currencySymbol,
    },
    totalExpense,
    memberCount: participantCount,
    perMemberShare: participantCount > 0 ? totalExpense / participantCount : 0,
    settlements: enriched,
  });
}

export async function PATCH(
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
  const group = await loadGroupForAccess(groupId, session.user.id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
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
  const { fromUserId, toUserId, paid } = body as Record<string, unknown>;
  if (typeof fromUserId !== "string" || !UUID_RE.test(fromUserId)) {
    return NextResponse.json({ error: "Invalid from user" }, { status: 400 });
  }
  if (typeof toUserId !== "string" || !UUID_RE.test(toUserId)) {
    return NextResponse.json({ error: "Invalid to user" }, { status: 400 });
  }
  if (typeof paid !== "boolean") {
    return NextResponse.json({ error: "Invalid paid value" }, { status: 400 });
  }
  if (toUserId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the recipient can update this settlement" },
      { status: 403 },
    );
  }

  await db
    .insert(settlements)
    .values({ groupId, fromUserId, toUserId, paid })
    .onConflictDoUpdate({
      target: [
        settlements.groupId,
        settlements.fromUserId,
        settlements.toUserId,
      ],
      set: { paid, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
