import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { SettlementView } from "@/components/expense-groups/settlement-view";

export const dynamic = "force-dynamic";

export default async function SettlePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-8">
        <div className="flex w-full max-w-3xl items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <ArrowLeftIcon />
            Back
          </Button>
        </div>
        <SettlementView groupId={groupId} />
      </main>
    </div>
  );
}
