import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role ?? null;

  // root guard
  if (pathname === "/") {
    if (!token) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
  }

  // /admin guard
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(
        new URL(`/auth?next=${encodeURIComponent(pathname)}`, req.url)
      );
    }
    const roleStr = String(role ?? "").toLowerCase();
    if (roleStr !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // /staff guard
  if (pathname.startsWith("/staff")) {
    if (!token) {
      return NextResponse.redirect(
        new URL(`/auth?next=${encodeURIComponent(pathname)}`, req.url)
      );
    }
    const roleStr = String(role ?? "").toLowerCase();
    if (roleStr !== "staff" && roleStr !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/staff/:path*"],
};
