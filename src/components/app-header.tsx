import Link from "next/link";

import { getSession } from "@/lib/auth/session";
import { UserMenu } from "@/components/user-menu";
import { ExpenseGroupToolbar } from "@/components/expense-groups/expense-group-toolbar";

export async function AppHeader() {
  const session = await getSession();
  const user = session?.user;

  return (
    <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <Link
          href="/"
          className="font-heading text-sm font-medium hover:opacity-80"
        >
          Splitty
        </Link>
        {user ? <ExpenseGroupToolbar /> : null}
      </div>
      <div className="flex items-center gap-1">
        <UserMenu name={user?.name ?? null} email={user?.email ?? null} />
      </div>
    </header>
  );
}
