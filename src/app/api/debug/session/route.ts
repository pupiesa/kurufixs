import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET,
    });
    let session = null;
    try {
      session = await auth();
    } catch (err) {
      session = { error: String(err) };
    }
    return NextResponse.json({ token: token ?? null, session });
  } catch (error) {
    console.error("/api/debug/session error", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
