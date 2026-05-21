import { NextResponse } from "next/server";
import { desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { currencies, expenseGroupMembers, expenseGroups } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const rows = await db
    .selectDistinct({
      id: expenseGroups.id,
      name: expenseGroups.name,
      ownerId: expenseGroups.ownerId,
      currencyCode: expenseGroups.currencyCode,
      currencySymbol: currencies.symbol,
      locked: expenseGroups.locked,
      createdAt: expenseGroups.createdAt,
    })
    .from(expenseGroups)
    .innerJoin(currencies, eq(currencies.code, expenseGroups.currencyCode))
    .leftJoin(
      expenseGroupMembers,
      eq(expenseGroupMembers.groupId, expenseGroups.id),
    )
    .where(
      or(
        eq(expenseGroups.ownerId, session.user.id),
        eq(expenseGroupMembers.userId, session.user.id),
      ),
    )
    .orderBy(desc(expenseGroups.createdAt));

  return NextResponse.json({
    groups: rows.map((row) => ({
      id: row.id,
      name: row.name,
      isOwner: row.ownerId === session.user.id,
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
      locked: row.locked,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
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
  const { name } = body as Record<string, unknown>;
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const trimmed = name.trim();
  if (trimmed.length > 80) {
    return NextResponse.json(
      { error: "Name must be 80 characters or fewer" },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(expenseGroups)
    .values({ name: trimmed, ownerId: session.user.id })
    .returning({
      id: expenseGroups.id,
      name: expenseGroups.name,
      currencyCode: expenseGroups.currencyCode,
      locked: expenseGroups.locked,
    });

  await db
    .insert(expenseGroupMembers)
    .values({ groupId: created.id, userId: session.user.id })
    .onConflictDoNothing();

  const [currency] = await db
    .select({ symbol: currencies.symbol })
    .from(currencies)
    .where(eq(currencies.code, created.currencyCode))
    .limit(1);

  return NextResponse.json({
    group: {
      id: created.id,
      name: created.name,
      isOwner: true,
      currencyCode: created.currencyCode,
      currencySymbol: currency?.symbol ?? "",
      locked: created.locked,
    },
  });
}
