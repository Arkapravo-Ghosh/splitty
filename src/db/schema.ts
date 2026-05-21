import { relations } from "drizzle-orm";
import {
  boolean,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  // FK to expense_groups.id is set at the database level (ON DELETE SET NULL).
  // We don't declare it via drizzle's `references()` here to avoid a circular
  // table reference, since expense_groups already references users.
  lastSelectedGroupId: uuid("last_selected_group_id"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const currencies = pgTable("currencies", {
  code: text("code").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
});

export type Currency = typeof currencies.$inferSelect;

export const expenseGroups = pgTable("expense_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currencyCode: text("currency_code")
    .notNull()
    .default("INR")
    .references(() => currencies.code),
  locked: boolean("locked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ExpenseGroup = typeof expenseGroups.$inferSelect;
export type NewExpenseGroup = typeof expenseGroups.$inferInsert;

export const expenseGroupMembers = pgTable(
  "expense_group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => expenseGroups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

export type ExpenseGroupMember = typeof expenseGroupMembers.$inferSelect;
export type NewExpenseGroupMember = typeof expenseGroupMembers.$inferInsert;

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => expenseGroups.id, { onDelete: "cascade" }),
  addedByUserId: uuid("added_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  paidByUserId: uuid("paid_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export const settlements = pgTable(
  "settlements",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => expenseGroups.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    paid: boolean("paid").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.groupId, table.fromUserId, table.toUserId],
    }),
  ],
);

export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;

export const expenseGroupsRelations = relations(expenseGroups, ({ many, one }) => ({
  members: many(expenseGroupMembers),
  expenses: many(expenses),
  owner: one(users, {
    fields: [expenseGroups.ownerId],
    references: [users.id],
  }),
  currency: one(currencies, {
    fields: [expenseGroups.currencyCode],
    references: [currencies.code],
  }),
}));

export const expenseGroupMembersRelations = relations(
  expenseGroupMembers,
  ({ one }) => ({
    group: one(expenseGroups, {
      fields: [expenseGroupMembers.groupId],
      references: [expenseGroups.id],
    }),
    user: one(users, {
      fields: [expenseGroupMembers.userId],
      references: [users.id],
    }),
  }),
);

export const expensesRelations = relations(expenses, ({ one }) => ({
  group: one(expenseGroups, {
    fields: [expenses.groupId],
    references: [expenseGroups.id],
  }),
  addedBy: one(users, {
    fields: [expenses.addedByUserId],
    references: [users.id],
  }),
  paidBy: one(users, {
    fields: [expenses.paidByUserId],
    references: [users.id],
  }),
}));
