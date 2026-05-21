import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { expenseGroupMembers, expenseGroups } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ groupId: string; userId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { groupId, userId } = await ctx.params;
  if (!UUID_RE.test(groupId) || !UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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
      { error: "Only the owner can revoke access" },
      { status: 403 },
    );
  }
  if (group.ownerId === userId) {
    return NextResponse.json(
      { error: "The owner cannot be removed" },
      { status: 400 },
    );
  }

  await db
    .delete(expenseGroupMembers)
    .where(
      and(
        eq(expenseGroupMembers.groupId, groupId),
        eq(expenseGroupMembers.userId, userId),
      ),
    );

  return NextResponse.json({ ok: true });
}
