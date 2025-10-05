import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // Prisma requires Node runtime

export async function POST(req: Request) {
  try {
    const { name, email, username, password } = await req.json();

    const emailLower = email ? String(email).trim().toLowerCase() : null;
    const usernameLower = username
      ? String(username).trim().toLowerCase()
      : null;

    if (!password || (!emailLower && !usernameLower)) {
      return NextResponse.json(
        { message: "Email or username and password required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const ors: any[] = [];
    if (emailLower) ors.push({ email: emailLower });
    if (usernameLower) ors.push({ username: usernameLower });

    const exists = await prisma.user.findFirst({
      where: { OR: ors },
      select: { id: true },
    });
    if (exists)
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );

    const passwordHash = await bcrypt.hash(password, 12);

    // Ensure default "viewer" role
    let viewer = await prisma.role.findUnique({ where: { name: "viewer" } });
    if (!viewer)
      viewer = await prisma.role.create({
        data: { name: "viewer", description: "Default read-only role" },
      });

    await prisma.user.create({
      data: {
        name: name ? String(name) : null,
        email: emailLower,
        username: usernameLower,
        passwordHash,
        roleId: viewer.id,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("Register API error:", e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
