"use client";

import { useState } from "react";
import { UsersThreeIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { ExpenseGroupSwitcher } from "./expense-group-switcher";
import { ExpenseGroupAccessDialog } from "./expense-group-access-dialog";
import { useExpenseGroups } from "./expense-group-context";

export function ExpenseGroupToolbar() {
  const { activeGroup } = useExpenseGroups();
  const [accessOpen, setAccessOpen] = useState(false);
  const label = activeGroup?.isOwner ? "Manage access" : "View access";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <ExpenseGroupSwitcher />
      <Button
        variant="outline"
        size="sm"
        disabled={!activeGroup}
        aria-label={label}
        onClick={() => setAccessOpen(true)}
        className="px-2 sm:px-2.5"
      >
        <UsersThreeIcon />
        <span className="sr-only sm:not-sr-only">{label}</span>
      </Button>
      <ExpenseGroupAccessDialog
        open={accessOpen}
        onOpenChange={setAccessOpen}
      />
    </div>
  );
}
