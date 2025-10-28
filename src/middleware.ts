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
    if (!token || role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/staff")) {
    if (!token || (role !== "staff" && role !== "admin")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/staff/:path*"],
};
