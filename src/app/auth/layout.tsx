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
      {children}
    </div>
  );
}
