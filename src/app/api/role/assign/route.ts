import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // re-check actor role from DB for freshness
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { role: { select: { name: true } } },
    });
    if (actor?.role?.name !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body)
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { userId, roleName } = body as { userId?: string; roleName?: string };
    if (!userId || !roleName) {
      return NextResponse.json(
        { error: "userId and roleName required" },
        { status: 400 },
      );
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
    });

    // Optionally revalidate admin/staff pages if you're using cache/revalidate
    // revalidatePath('/admin');

    return NextResponse.json({ ok: true, userId: user.id, role: role.name });
  } catch (e: any) {
    console.error("/api/role/assign error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
