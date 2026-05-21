import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import { eq } from "drizzle-orm";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ExpenseGroupProvider } from "@/components/expense-groups/expense-group-context";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { listGroupsForUser } from "@/lib/expense-groups/server";

const jetbrainsMonoHeading = JetBrains_Mono({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Splitty",
    template: "%s · Splitty",
  },
  description: "Split your expenses Easily",
  applicationName: "Splitty",
  keywords: [
    "Splitty",
    "split expenses",
    "expense sharing",
    "group expenses",
    "settle up",
    "shared bills",
  ],
  openGraph: {
    title: "Splitty",
    description: "Split your expenses Easily",
    siteName: "Splitty",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Splitty",
    description: "Split your expenses Easily",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  let initialGroups: Awaited<ReturnType<typeof listGroupsForUser>> = [];
  let storedActiveGroupId: string | null = null;
  if (session) {
    const [me] = await db
      .select({ lastSelectedGroupId: users.lastSelectedGroupId })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    storedActiveGroupId = me?.lastSelectedGroupId ?? null;
    initialGroups = await listGroupsForUser(session.user.id);
  }
  const initialActiveGroupId =
    storedActiveGroupId &&
    initialGroups.some((g) => g.id === storedActiveGroupId)
      ? storedActiveGroupId
      : initialGroups[0]?.id ?? null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, jetbrainsMonoHeading.variable)}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ExpenseGroupProvider
            currentUser={session?.user ?? null}
            initialGroups={initialGroups}
            initialActiveGroupId={initialActiveGroupId}
          >
            {children}
            <Toaster richColors closeButton />
          </ExpenseGroupProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
