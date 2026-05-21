"use client";

export class ExpenseGroupError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ExpenseGroupError";
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : null) ?? `Request failed (${res.status})`;
    throw new ExpenseGroupError(message, res.status);
  }
  return body as T;
}

export type ExpenseGroupSummary = {
  id: string;
  name: string;
  isOwner: boolean;
  currencyCode: string;
  currencySymbol: string;
  locked: boolean;
};

export type ExpenseGroupMemberSummary = {
  userId: string;
  email: string;
  name: string;
  isOwner: boolean;
};

export type CurrencyOption = {
  code: string;
  symbol: string;
  name: string;
};

export type ExpensePrincipal = {
  id: string;
  name: string;
  email: string;
};

export type ExpenseRow = {
  id: string;
  amount: string;
  details: string | null;
  createdAt: string;
  addedBy: ExpensePrincipal;
  paidBy: ExpensePrincipal;
};

export type SettlementRow = {
  fromUserId: string;
  fromName: string;
  fromEmail: string;
  toUserId: string;
  toName: string;
  toEmail: string;
  amount: number;
  paid: boolean;
};

export type SettlementsResponse = {
  group: {
    id: string;
    name: string;
    currencyCode: string;
    currencySymbol: string;
  };
  totalExpense: number;
  memberCount: number;
  perMemberShare: number;
  settlements: SettlementRow[];
};

export const expenseGroupClient = {
  list() {
    return call<{ groups: ExpenseGroupSummary[] }>("/api/expense-groups");
  },
  create({ name }: { name: string }) {
    return call<{ group: ExpenseGroupSummary }>("/api/expense-groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },
  rename(groupId: string, name: string) {
    return call<{ group: ExpenseGroupSummary }>(
      `/api/expense-groups/${groupId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name }),
      },
    );
  },
  setCurrency(groupId: string, currencyCode: string) {
    return call<{ group: ExpenseGroupSummary }>(
      `/api/expense-groups/${groupId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ currencyCode }),
      },
    );
  },
  setLocked(groupId: string, locked: boolean) {
    return call<{ group: ExpenseGroupSummary }>(
      `/api/expense-groups/${groupId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ locked }),
      },
    );
  },
  remove(groupId: string) {
    return call<{ ok: true }>(`/api/expense-groups/${groupId}`, {
      method: "DELETE",
    });
  },
  listMembers(groupId: string) {
    return call<{ members: ExpenseGroupMemberSummary[] }>(
      `/api/expense-groups/${groupId}/members`,
    );
  },
  addMember(groupId: string, email: string) {
    return call<{ member: ExpenseGroupMemberSummary }>(
      `/api/expense-groups/${groupId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
    );
  },
  revokeMember(groupId: string, userId: string) {
    return call<{ ok: true }>(
      `/api/expense-groups/${groupId}/members/${userId}`,
      { method: "DELETE" },
    );
  },
  listExpenses(groupId: string) {
    return call<{ expenses: ExpenseRow[] }>(
      `/api/expense-groups/${groupId}/expenses`,
    );
  },
  addExpense(
    groupId: string,
    input: {
      amount: number;
      paidByUserId: string;
      addedByUserId: string;
      details?: string | null;
    },
  ) {
    return call<{ expense: ExpenseRow }>(
      `/api/expense-groups/${groupId}/expenses`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },
  updateExpense(
    groupId: string,
    expenseId: string,
    input: {
      amount?: number;
      paidByUserId?: string;
      details?: string | null;
    },
  ) {
    return call<{ expense: ExpenseRow }>(
      `/api/expense-groups/${groupId}/expenses/${expenseId}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    );
  },
  removeExpense(groupId: string, expenseId: string) {
    return call<{ ok: true }>(
      `/api/expense-groups/${groupId}/expenses/${expenseId}`,
      { method: "DELETE" },
    );
  },
  listSettlements(groupId: string) {
    return call<SettlementsResponse>(
      `/api/expense-groups/${groupId}/settlements`,
    );
  },
  setSettlementPaid(
    groupId: string,
    input: { fromUserId: string; toUserId: string; paid: boolean },
  ) {
    return call<{ ok: true }>(
      `/api/expense-groups/${groupId}/settlements`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    );
  },
};

export const currencyClient = {
  list() {
    return call<{ currencies: CurrencyOption[] }>("/api/currencies");
  },
};
