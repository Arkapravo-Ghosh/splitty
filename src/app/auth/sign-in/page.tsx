"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

function describeSignInError(err: unknown): { title: string; description?: string } {
  const raw = err instanceof Error ? err.message : "";
  const code =
    typeof err === "object" && err && "code" in err
      ? String((err as { code?: unknown }).code ?? "")
      : "";
  const status =
    typeof err === "object" && err && "status" in err
      ? Number((err as { status?: unknown }).status ?? 0)
      : 0;

  if (
    code === "INVALID_EMAIL_OR_PASSWORD" ||
    /invalid (email|password|credentials)/i.test(raw) ||
    status === 401
  ) {
    return {
      title: "Incorrect email or password",
      description: "Double-check your credentials and try again.",
    };
  }
  if (code === "USER_NOT_FOUND" || /no (such )?user|not found/i.test(raw)) {
    return {
      title: "No account found",
      description: "We couldn't find an account with that email.",
    };
  }
  return { title: raw || "Sign-in failed" };
}

export default function SignInPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<{ title: string; description?: string } | null>(
    null,
  );

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Welcome back. Enter your credentials to continue.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const data = new FormData(e.currentTarget);
            const email = String(data.get("email") ?? "");
            const password = String(data.get("password") ?? "");
            startTransition(async () => {
              try {
                await authClient.signIn({ email, password });
                router.replace("/");
                router.refresh();
              } catch (err) {
                const e = describeSignInError(err);
                setError(e);
                toast.error(e.title, { description: e.description });
              }
            });
          }}
        >
          <CardContent className="flex flex-col gap-4">
            {error ? (
              <Alert variant="destructive">
                <WarningCircleIcon weight="fill" />
                <AlertTitle>{error.title}</AlertTitle>
                {error.description ? (
                  <AlertDescription>{error.description}</AlertDescription>
                ) : null}
              </Alert>
            ) : null}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={pending} className="mt-1">
              {pending ? (
                <>
                  <Spinner /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              No account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </form>
      </Card>
    </main>
  );
}
