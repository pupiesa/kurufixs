import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const trustedHosts = [
  'www.bookingonline.software',
  'bunsom2504.3bbddns.com:56610',
  'localhost:3000'
];

export async function middleware(req: NextRequest) {
  // Check if the host is trusted
  const hostname = req.headers.get('host') || '';
  const isTrustedHost = trustedHosts.some(host => hostname.includes(host));
  
  if (!isTrustedHost) {
    return new NextResponse(null, {
      status: 400,
      statusText: 'Bad Request',
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  }
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
