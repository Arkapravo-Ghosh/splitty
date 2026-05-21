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

function describeSignUpError(err: unknown): { title: string; description?: string } {
  const raw = err instanceof Error ? err.message : "";
  const code =
    typeof err === "object" && err && "code" in err
      ? String((err as { code?: unknown }).code ?? "")
      : "";

  if (
    code === "USER_ALREADY_EXISTS" ||
    /already exists|already registered|email.*taken/i.test(raw)
  ) {
    return {
      title: "Email already in use",
      description: "An account with this email exists. Try signing in instead.",
    };
  }
  if (code === "PASSWORD_TOO_SHORT" || /password.*(short|too small|min)/i.test(raw)) {
    return {
      title: "Password too short",
      description: "Use at least 8 characters.",
    };
  }
  if (code === "INVALID_EMAIL" || /invalid email/i.test(raw)) {
    return {
      title: "Invalid email",
      description: "Enter a valid email address.",
    };
  }
  return { title: raw || "Sign-up failed" };
}

export default function SignUpPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<{ title: string; description?: string } | null>(
    null,
  );

  return (
    <main className="w-full max-w-sm">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Set up an account to start splitting.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const data = new FormData(e.currentTarget);
            const name = String(data.get("name") ?? "");
            const email = String(data.get("email") ?? "");
            const password = String(data.get("password") ?? "");
            startTransition(async () => {
              try {
                await authClient.signUp({ name, email, password });
                router.replace("/");
                router.refresh();
              } catch (err) {
                const e = describeSignUpError(err);
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
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                />
              </Field>
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
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={pending} className="mt-1">
              {pending ? (
                <>
                  <Spinner /> Creating account…
                </>
              ) : (
                "Sign up"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </form>
      </Card>
    </main>
  );
}
