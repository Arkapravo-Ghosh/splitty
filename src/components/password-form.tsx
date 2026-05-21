"use client";

import { useRef, useState, useTransition } from "react";
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

function describePasswordError(raw: string): { title: string; description?: string } {
  if (
    /invalid.*password|incorrect password|wrong password|password.*incorrect|invalid email or password/i.test(
      raw,
    )
  ) {
    return {
      title: "Current password is wrong",
      description: "Double-check it and try again.",
    };
  }
  if (/password.*(short|min|too small|length)/i.test(raw)) {
    return {
      title: "New password is too short",
      description: "Use at least 8 characters.",
    };
  }
  return { title: raw || "Couldn't update password" };
}

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<{ title: string; description?: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Pick a new password — at least 8 characters.
        </CardDescription>
      </CardHeader>
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const data = new FormData(e.currentTarget);
          const currentPassword = String(data.get("currentPassword") ?? "");
          const newPassword = String(data.get("newPassword") ?? "");
          const confirmPassword = String(data.get("confirmPassword") ?? "");
          if (newPassword !== confirmPassword) {
            const e = {
              title: "Passwords don't match",
              description: "The new password and confirmation must be the same.",
            };
            setError(e);
            toast.error(e.title, { description: e.description });
            return;
          }
          startTransition(async () => {
            try {
              await authClient.changePassword({ currentPassword, newPassword });
              toast.success("Password updated");
              formRef.current?.reset();
            } catch (err) {
              const raw = err instanceof Error ? err.message : "";
              const e = describePasswordError(raw);
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
              <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="newPassword">New password</FieldLabel>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
          </FieldGroup>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Spinner /> Updating…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
