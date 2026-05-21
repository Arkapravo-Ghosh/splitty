"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  expenseGroupClient,
  type ExpenseGroupSummary,
} from "@/lib/expense-groups/client";

async function persistActiveGroup(groupId: string | null) {
  try {
    await fetch("/api/auth/active-group", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
  } catch {
    // Best-effort: persistence shouldn't break the UI.
  }
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

type ExpenseGroupContextValue = {
  groups: ExpenseGroupSummary[];
  activeGroupId: string | null;
  activeGroup: ExpenseGroupSummary | null;
  loading: boolean;
  error: string | null;
  currentUser: CurrentUser | null;
  setActiveGroupId: (id: string | null) => void;
  refresh: () => Promise<void>;
  upsertGroup: (group: ExpenseGroupSummary) => void;
  removeGroup: (groupId: string) => void;
};

const ExpenseGroupContext = createContext<ExpenseGroupContextValue | null>(null);

export function ExpenseGroupProvider({
  children,
  currentUser = null,
  initialGroups = [],
  initialActiveGroupId = null,
}: {
  children: React.ReactNode;
  currentUser?: CurrentUser | null;
  initialGroups?: ExpenseGroupSummary[];
  initialActiveGroupId?: string | null;
}) {
  const [groups, setGroups] = useState<ExpenseGroupSummary[]>(initialGroups);
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(
    initialActiveGroupId,
  );
  const hasInitial = initialGroups.length > 0 || initialActiveGroupId !== null;
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);
  const skipFirstRefresh = useRef(hasInitial);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { groups } = await expenseGroupClient.list();
      setGroups(groups);
      setActiveGroupIdState((current) => {
        if (current && groups.some((g) => g.id === current)) return current;
        return groups[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipFirstRefresh.current) {
      skipFirstRefresh.current = false;
      return;
    }
    void refresh();
  }, [refresh]);

  const initialActiveRef = useRef(initialActiveGroupId);
  useEffect(() => {
    // Skip persistence on the very first commit if it matches what we got
    // from the server — no need to round-trip.
    if (activeGroupId === initialActiveRef.current) return;
    initialActiveRef.current = activeGroupId;
    if (!currentUser) return;
    void persistActiveGroup(activeGroupId);
  }, [activeGroupId, currentUser]);

  const setActiveGroupId = useCallback((id: string | null) => {
    setActiveGroupIdState(id);
  }, []);

  const upsertGroup = useCallback((group: ExpenseGroupSummary) => {
    setGroups((prev) => {
      const without = prev.filter((g) => g.id !== group.id);
      return [group, ...without];
    });
    setActiveGroupIdState(group.id);
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setActiveGroupIdState((current) => (current === groupId ? null : current));
  }, []);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId],
  );

  const value = useMemo(
    () => ({
      groups,
      activeGroupId,
      activeGroup,
      loading,
      error,
      currentUser,
      setActiveGroupId,
      refresh,
      upsertGroup,
      removeGroup,
    }),
    [
      groups,
      activeGroupId,
      activeGroup,
      loading,
      error,
      currentUser,
      setActiveGroupId,
      refresh,
      upsertGroup,
      removeGroup,
    ],
  );

  return (
    <ExpenseGroupContext.Provider value={value}>
      {children}
    </ExpenseGroupContext.Provider>
  );
}

export function useExpenseGroups() {
  const ctx = useContext(ExpenseGroupContext);
  if (!ctx) {
    throw new Error("useExpenseGroups must be used inside ExpenseGroupProvider");
  }
  return ctx;
}
