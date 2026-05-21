import { getSession } from "@/lib/auth/session";
import { AppHeader } from "@/components/app-header";
import { ExpensesPanel } from "@/components/expense-groups/expenses-panel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  const displayName = session?.user.name ?? session?.user.email ?? "there";

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center gap-8 px-6 py-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Hello, {displayName}
        </h1>
        <ExpensesPanel />
      </main>
    </div>
  );
}
