import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const types = await prisma.assetType.findMany({
      select: { id: true, name: true },
    });
    const statuses = await prisma.assetStatus.findMany({
      select: { id: true, name: true },
    });
    return NextResponse.json({ types, statuses });
  } catch (e: any) {
    console.error("/api/assets/meta error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
