import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { currencies, expenseGroups } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { name, currencyCode, locked } = body as Record<string, unknown>;

  const patch: { name?: string; currencyCode?: string; locked?: boolean } = {};
  if (name !== undefined) {
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
    patch.name = trimmed;
  }
  if (currencyCode !== undefined) {
    if (typeof currencyCode !== "string" || !currencyCode.trim()) {
      return NextResponse.json(
        { error: "Currency code is required" },
        { status: 400 },
      );
    }
    const normalized = currencyCode.trim().toUpperCase();
    const [exists] = await db
      .select({ code: currencies.code })
      .from(currencies)
      .where(eq(currencies.code, normalized))
      .limit(1);
    if (!exists) {
      return NextResponse.json(
        { error: "Unknown currency" },
        { status: 400 },
      );
    }
    patch.currencyCode = normalized;
  }
  if (locked !== undefined) {
    if (typeof locked !== "boolean") {
      return NextResponse.json(
        { error: "Locked must be a boolean" },
        { status: 400 },
      );
    }
    patch.locked = locked;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 },
    );
  }

  const [group] = await db
    .select({ ownerId: expenseGroups.ownerId })
    .from(expenseGroups)
    .where(eq(expenseGroups.id, groupId))
    .limit(1);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can update this group" },
      { status: 403 },
    );
  }

  const [updated] = await db
    .update(expenseGroups)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(expenseGroups.id, groupId))
    .returning({
      id: expenseGroups.id,
      name: expenseGroups.name,
      currencyCode: expenseGroups.currencyCode,
      locked: expenseGroups.locked,
    });

  const [currency] = await db
    .select({ symbol: currencies.symbol })
    .from(currencies)
    .where(eq(currencies.code, updated.currencyCode))
    .limit(1);

  return NextResponse.json({
    group: {
      id: updated.id,
      name: updated.name,
      isOwner: true,
      currencyCode: updated.currencyCode,
      currencySymbol: currency?.symbol ?? "",
      locked: updated.locked,
    },
  });
}

export async function DELETE(
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

  const [group] = await db
    .select({ ownerId: expenseGroups.ownerId })
    .from(expenseGroups)
    .where(eq(expenseGroups.id, groupId))
    .limit(1);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can delete this group" },
      { status: 403 },
    );
  }

  await db.delete(expenseGroups).where(eq(expenseGroups.id, groupId));

  return NextResponse.json({ ok: true });
}
