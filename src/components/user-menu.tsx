"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOutIcon, UserIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
};

function initialsFor(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/);
  const letters = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : source.slice(0, 2);
  return letters.toUpperCase();
}

export function UserMenu({ name, email }: UserMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        disabled={pending}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      >
        <Avatar>
          <AvatarFallback>{initialsFor(name, email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {name ?? "Account"}
            </span>
            {email ? (
              <span className="text-xs text-muted-foreground">{email}</span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserIcon /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await authClient.signOut();
                router.replace("/auth/sign-in");
                router.refresh();
              } catch (err) {
                const message =
                  err instanceof Error ? err.message : "Failed to sign out";
                toast.error(message);
              }
            })
          }
        >
          <SignOutIcon /> {pending ? "Signing out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
