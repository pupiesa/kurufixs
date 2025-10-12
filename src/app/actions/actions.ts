"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  const name = (formData.get("name") ?? "").toString().trim();
  const email = (formData.get("email") ?? "").toString().trim();
  const username = (formData.get("username") ?? "").toString().trim();
  const password = (formData.get("password") ?? "").toString();

  const data: Record<string, unknown> = {};
  if (name.length > 0) data.name = name;
  if (email.length > 0) data.email = email;
  if (username.length > 0) data.username = username;
  if (password.length > 0) data.passwordHash = await bcrypt.hash(password, 10);

  if (Object.keys(data).length === 0) return;

  try {
    await prisma.user.update({ where: { id: userId }, data });
    revalidatePath("/account");
  } catch (e: any) {
    console.error("updateProfileAction error", e);
  }
}
