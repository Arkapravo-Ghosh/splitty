"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  defaultName: string;
  email: string;
};

export function ProfileForm({ defaultName, email }: Props) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = name.trim() !== defaultName.trim() && name.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account details</CardTitle>
        <CardDescription>
          Your email can&apos;t be changed here yet.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const trimmed = name.trim();
          if (!trimmed) {
            setError("Name can't be empty");
            return;
          }
          startTransition(async () => {
            try {
              await authClient.updateProfile({ name: trimmed });
              toast.success("Profile updated");
              router.refresh();
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Update failed";
              setError(message);
              toast.error(message);
            }
          });
        }}
      >
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <WarningCircleIcon weight="fill" />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          ) : null}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-name">Name</FieldLabel>
              <Input
                id="profile-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input
                id="profile-email"
                name="email"
                type="email"
                value={email}
                disabled
                readOnly
              />
              <FieldDescription>
                Contact support to change the email on this account.
              </FieldDescription>
            </Field>
          </FieldGroup>
          <div className="flex justify-end">
            <Button type="submit" disabled={!dirty || pending}>
              {pending ? (
                <>
                  <Spinner /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
