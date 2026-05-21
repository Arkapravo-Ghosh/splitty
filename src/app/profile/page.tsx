import { getSession } from "@/lib/auth/session";
import { AppHeader } from "@/components/app-header";
import { ProfileForm } from "@/components/profile-form";
import { PasswordForm } from "@/components/password-form";
import { ThemeCard } from "@/components/theme-card";
import { DeleteAccountCard } from "@/components/delete-account-card";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  const user = session?.user;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Profile
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your account details and password.
          </p>
        </div>
        <ProfileForm
          defaultName={user?.name ?? ""}
          email={user?.email ?? ""}
        />
        <Separator />
        <PasswordForm />
        <Separator />
        <ThemeCard />
        <Separator />
        <DeleteAccountCard />
      </main>
    </div>
  );
}
