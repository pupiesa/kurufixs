// middleware.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt"; // Edge-safe JWT reader

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role ?? null;

  // Diagnostic logging and extra guards to prevent redirect loops between `/` and `/auth`.
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const referer = req.headers.get("referer") || "";
    const hasNextAuthCookie = cookieHeader.includes("next-auth");
    console.log(
      "middleware: path=",
      pathname,
      "tokenPresent=",
      Boolean(token),
      "hasNextAuthCookie=",
      hasNextAuthCookie,
      "referer=",
      referer
    );

    if (pathname === "/" && !token) {
      // If the referer is the auth page or a next-auth cookie exists, allow the request
      // so the auth page can inspect and re-establish the session, breaking redirect loops.
      if (hasNextAuthCookie || referer.includes("/auth")) {
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL("/auth", req.url));
    }
  } catch (err) {
    // Don't block requests if logging fails
    console.error("middleware diagnostics error", err);
  }

  if (pathname.startsWith("/admin")) {
    // Normalize role string and accept when token indicates admin.
    const roleStr = String(role ?? "").toLowerCase();
    const cookieHeader = req.headers.get("cookie") || "";
    const referer = req.headers.get("referer") || "";
    const hasNextAuthCookie = cookieHeader.includes("next-auth");

    // If token is missing but a next-auth cookie exists, allow the request through
    // so server-side rendering can perform a fresh DB-backed role check. This
    // avoids mistakenly redirecting users when tokens are stale or when the
    // middleware cannot verify JWTs in the deployment environment.
    if (!token && hasNextAuthCookie) {
      return NextResponse.next();
    }

    if (roleStr !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/staff")) {
    const roleStr = String(role ?? "").toLowerCase();
    const cookieHeader = req.headers.get("cookie") || "";
    const hasNextAuthCookie = cookieHeader.includes("next-auth");

    if (!token && hasNextAuthCookie) {
      return NextResponse.next();
    }

    if (roleStr !== "staff" && roleStr !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Only match the root path at the edge. Disable edge-level protection for
  // /admin and /staff to avoid redirect loops when JWT verification fails in
  // certain deployment environments. Server-side pages/actions still perform
  // DB-backed role checks and will enforce authorization.
  matcher: ["/"],
};
