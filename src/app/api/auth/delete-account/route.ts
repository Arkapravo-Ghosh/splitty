import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Soft-delete: free up the email so the user can re-register, wipe the
  // password so the account can't be signed into, but keep `name` and the
  // user row intact so expenses, settlements, and member rows that reference
  // this user continue to render with their historical name.
  const tombstoneEmail = `deleted-${session.user.id}@deleted.local`;
  const wipedHash = `disabled-${randomBytes(16).toString("hex")}`;
  await db
    .update(users)
    .set({
      email: tombstoneEmail,
      passwordHash: wipedHash,
      deletedAt: new Date(),
      lastSelectedGroupId: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  const store = await cookies();
  store.delete(SESSION_COOKIE);

  return NextResponse.json({ ok: true });
}
