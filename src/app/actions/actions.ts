"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function updateProfileAction(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  const name = (formData.get("name") ?? "").toString().trim();
  const email = (formData.get("email") ?? "").toString().trim();
  const username = (formData.get("username") ?? "").toString().trim();
  const password = (formData.get("password") ?? "").toString();
  const confirmPassword = (formData.get("confirmPassword") ?? "").toString();

  const data: Record<string, unknown> = {};
  if (name.length > 0) data.name = name;
  if (email.length > 0) data.email = email;
  // username immutable once set
  if (username.length > 0) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    if (!current?.username) {
      data.username = username;
    }
  }
  if (password.length > 0) {
    if (password !== confirmPassword) {
      redirect("/account?error=password_mismatch");
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  if (Object.keys(data).length === 0) return;

  try {
    await prisma.user.update({ where: { id: userId }, data });
    revalidatePath("/account");
    redirect("/account?updated=1");
  } catch (e: any) {
    console.error("updateProfileAction error", e);
  }
}

export async function updateTicketAction(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  const ticketId = (formData.get("ticketId") ?? "").toString();
  const newStatus = (formData.get("status") ?? "").toString();
  const message = (formData.get("message") ?? "").toString().trim();

  if (!ticketId || !newStatus) return;

  try {
    // Update ticket status
    await prisma.repairReport.update({
      where: { id: ticketId },
      data: { status: newStatus as any },
    });

    // Log activity
    await prisma.repairActivityLog.create({
      data: {
        reportId: ticketId,
        actorUserId: userId,
        message:
          message.length > 0 ? message : `Status changed to ${newStatus}`,
      },
    });

    revalidatePath(`/staff/${ticketId}`);
    revalidatePath("/staff");
  } catch (e: any) {
    console.error("updateTicketAction error", e);
    return;
  }

  // Perform redirect outside try/catch so NEXT_REDIRECT isn't swallowed
  redirect(`/staff`);
}

export async function updateAssetAction(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;

  const assetId = (formData.get("assetId") ?? "").toString();
  // Debug log: indicate action called (visible in server terminal)
  console.log("updateAssetAction called", { userId, assetId });

  if (!userId) {
    // Not authenticated - redirect to sign in (keeps control-flow outside try/catch)
    redirect(`/auth?next=/assets&error=not_authenticated`);
  }

  const assetName = (formData.get("assetName") ?? "").toString().trim();
  const assetCode = (formData.get("assetCode") ?? "").toString().trim();
  const typeName = (formData.get("typeName") ?? "").toString().trim();
  const statusName = (formData.get("statusName") ?? "").toString().trim();
  const building = (formData.get("building") ?? "").toString().trim();
  const room = (formData.get("room") ?? "").toString().trim();

  if (!assetId) return;

  // Ensure requester is admin (re-check from DB for freshness)
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (dbUser?.role?.name !== "admin") {
    console.warn("updateAssetAction: forbidden - user is not admin", {
      userId,
    });
    // Redirect to assets with an error flag so the UI can show a message
    redirect(`/assets?error=forbidden`);
  }

  try {
    const data: Record<string, any> = {};
    if (assetName) data.assetName = assetName;
    if (assetCode) data.assetCode = assetCode;

    // Upsert type and status by name (assumes name has a unique constraint)
    if (typeName) {
      const t = await prisma.assetType.upsert({
        where: { name: typeName },
        create: { name: typeName },
        update: { name: typeName },
      });
      data.typeId = t.id;
    }

    if (statusName) {
      const s = await prisma.assetStatus.upsert({
        where: { name: statusName },
        create: { name: statusName },
        update: { name: statusName },
      });
      data.statusId = s.id;
    }

    // Handle location: try to find existing or create new
    if (building || room) {
      const existing = await prisma.location.findFirst({
        where: { building: building || undefined, room: room || undefined },
      });
      if (existing) {
        data.locationId = existing.id;
      } else {
        const loc = await prisma.location.create({
          data: { building: building || "", room: room || "" },
        });
        data.locationId = loc.id;
      }
    }

    // If there's nothing to update, stop
    if (Object.keys(data).length === 0) return;

    await prisma.asset.update({ where: { id: assetId }, data });

    // Revalidate relevant pages
    revalidatePath(`/assets/${assetId}`);
    revalidatePath(`/assets`);
    console.log("updateAssetAction: asset updated", {
      assetId,
      updatedFields: Object.keys(data),
    });
  } catch (e: any) {
    console.error("updateAssetAction error", e);
    return;
  }

  // Redirect to assets list after successful update (include flag)
  redirect(`/assets?updated=1`);
}
