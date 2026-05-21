import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { expenseGroupMembers, expenseGroups, users } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadGroupForAccess(groupId: string, userId: string) {
  const [group] = await db
    .select({ id: expenseGroups.id, ownerId: expenseGroups.ownerId })
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
  return group ?? null;
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

  const memberRows = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
    })
    .from(expenseGroupMembers)
    .innerJoin(users, eq(users.id, expenseGroupMembers.userId))
    .where(eq(expenseGroupMembers.groupId, groupId));

  return NextResponse.json({
    members: memberRows.map((row) => ({
      userId: row.userId,
      email: row.email,
      name: row.name,
      isOwner: row.userId === group.ownerId,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { email } = body as Record<string, unknown>;
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 },
    );
  }

  const group = await loadGroupForAccess(groupId, session.user.id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the owner can add members" },
      { status: 403 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [target] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  if (!target) {
    return NextResponse.json(
      { error: "No user found with that email" },
      { status: 404 },
    );
  }

  await db
    .insert(expenseGroupMembers)
    .values({ groupId, userId: target.id })
    .onConflictDoNothing();

  return NextResponse.json({
    member: {
      userId: target.id,
      email: target.email,
      name: target.name,
      isOwner: target.id === group.ownerId,
    },
  });
}
