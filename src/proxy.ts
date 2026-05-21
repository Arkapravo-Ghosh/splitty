import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { verifySessionToken } from "@/lib/auth/jwt";

const AUTH_PATHS = ["/auth/sign-in", "/auth/sign-up"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPath = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isLandingPath = pathname === "/";

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let authed = false;
  if (token) {
    try {
      await verifySessionToken(token);
      authed = true;
    } catch {
      authed = false;
    }
  }

  if (!authed && !isAuthPath && !isLandingPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    return NextResponse.redirect(url);
  }
  if (authed && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|twitter-image|manifest\\.|robots\\.txt|sitemap\\.xml|api/).*)",
  ],
};
