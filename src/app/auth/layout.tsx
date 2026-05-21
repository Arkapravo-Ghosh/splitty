import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-end px-6 py-3">
        <ThemeToggle />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="size-12 mb-3" />
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Welcome to Splitty
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Split your expenses easily.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
