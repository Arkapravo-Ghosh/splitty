import "server-only";
import { desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { currencies, expenseGroupMembers, expenseGroups } from "@/db/schema";

export type ServerExpenseGroupSummary = {
  id: string;
  name: string;
  isOwner: boolean;
  currencyCode: string;
  currencySymbol: string;
  locked: boolean;
};

export async function listGroupsForUser(
  userId: string,
): Promise<ServerExpenseGroupSummary[]> {
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
        eq(expenseGroups.ownerId, userId),
        eq(expenseGroupMembers.userId, userId),
      ),
    )
    .orderBy(desc(expenseGroups.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    isOwner: row.ownerId === userId,
    currencyCode: row.currencyCode,
    currencySymbol: row.currencySymbol,
    locked: row.locked,
  }));
}
