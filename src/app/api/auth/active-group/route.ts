import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { expenseGroupMembers, expenseGroups, users } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request) {
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
  const { groupId } = body as Record<string, unknown>;

  if (groupId === null) {
    await db
      .update(users)
      .set({ lastSelectedGroupId: null, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));
    return NextResponse.json({ ok: true });
  }
  if (typeof groupId !== "string" || !UUID_RE.test(groupId)) {
    return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
  }

  // Verify the user has access to this group before storing.
  const [access] = await db
    .select({ id: expenseGroups.id })
    .from(expenseGroups)
    .leftJoin(
      expenseGroupMembers,
      and(
        eq(expenseGroupMembers.groupId, expenseGroups.id),
        eq(expenseGroupMembers.userId, session.user.id),
      ),
    )
    .where(
      and(
        eq(expenseGroups.id, groupId),
        or(
          eq(expenseGroups.ownerId, session.user.id),
          eq(expenseGroupMembers.userId, session.user.id),
        ),
      ),
    )
    .limit(1);
  if (!access) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  await db
    .update(users)
    .set({ lastSelectedGroupId: groupId, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
