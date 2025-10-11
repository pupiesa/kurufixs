// middleware.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt"; // Edge-safe JWT reader

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Read JWT from cookies (works on Edge). Ensure NEXTAUTH_SECRET is set.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (pathname === "/") {
    if (!token) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
  }

  // block ถ้าไม่ใช่ admin เวลาเข้าหน้า /admin/*
  if (pathname.startsWith("/admin")) {
    const role = (token as any)?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/app/:path*", "/admin/:path*"],
};
