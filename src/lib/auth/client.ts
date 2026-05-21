"use client";

export class AuthError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "AuthError";
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : null) ?? `Request failed (${res.status})`;
    throw new AuthError(message, res.status);
  }
  return body as T;
}

export const authClient = {
  signUp({ name, email, password }: { name: string; email: string; password: string }) {
    return call<{ ok: true }>("/api/auth/sign-up", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },
  signIn({ email, password }: { email: string; password: string }) {
    return call<{ ok: true }>("/api/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  signOut() {
    return call<{ ok: true }>("/api/auth/sign-out", { method: "POST" });
  },
  updateProfile({ name }: { name: string }) {
    return call<{ ok: true }>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },
  changePassword({
    currentPassword,
    newPassword,
  }: {
    currentPassword: string;
    newPassword: string;
  }) {
    return call<{ ok: true }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  deleteAccount() {
    return call<{ ok: true }>("/api/auth/delete-account", { method: "POST" });
  },
};
