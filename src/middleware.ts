// middleware.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt"; // Edge-safe JWT reader

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role ?? null;

  if (pathname === "/" && !token) {
    // If there's a NextAuth cookie present but getToken failed to verify it
    // (for example when NEXTAUTH_SECRET is missing in the deployment),
    // don't immediately redirect to /auth — let the auth page handle the session
    // to avoid redirect loops between `/` and `/auth`.
    const cookieHeader = req.headers.get("cookie") || "";
    if (cookieHeader.includes("next-auth")) {
      // Allow request to continue; the auth page or client can resolve the session
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/auth", req.url));
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
