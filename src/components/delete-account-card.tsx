"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function DeleteAccountCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    if (pending) return;
    startTransition(async () => {
      try {
        await authClient.deleteAccount();
        toast.success("Account deleted");
        setOpen(false);
        router.replace("/auth/sign-in");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete account";
        toast.error(message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          You won&apos;t be able to sign in anymore. Your name will stay on
          past expenses and settlements so others in your groups can still see
          who paid what. Your email is freed up so you can register again with
          it later.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={pending}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/50"
        >
          <TrashIcon />
          Delete account
        </Button>
      </CardContent>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This signs you out and disables future sign-ins. Your historical
              data (expenses, settlements, group membership records) stays in
              place under your name. This cannot be undone from inside the
              app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={confirmDelete}
            >
              {pending ? <Spinner /> : <TrashIcon />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
