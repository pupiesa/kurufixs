// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth"; // จาก NextAuth config

export async function middleware(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // require login สำหรับ /app/*
  if (pathname.startsWith("/app")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // block ถ้าไม่ใช่ admin เวลาเข้าหน้า /admin/*
  if (pathname.startsWith("/admin")) {
    const role = (session?.user as any)?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
