import "server-only";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "./cookie";
import { verifySessionToken, type SessionClaims } from "./jwt";

export type Session = {
  user: { id: string; email: string; name: string };
};

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const claims: SessionClaims = await verifySessionToken(token);
    return {
      user: { id: claims.sub, email: claims.email, name: claims.name },
    };
  } catch {
    return null;
  }
}
