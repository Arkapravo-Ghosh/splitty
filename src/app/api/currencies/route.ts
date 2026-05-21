import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { currencies } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const rows = await db
    .select({
      code: currencies.code,
      symbol: currencies.symbol,
      name: currencies.name,
    })
    .from(currencies)
    .orderBy(asc(currencies.code));
  return NextResponse.json({ currencies: rows });
}
