"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function addTypeAction(input: {
  name: string;
  description?: string | null;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");

  const name = (input?.name ?? "").trim();
  const description = input?.description?.toString().trim() || null;
  if (!name) throw new Error("name is required");

  if (!prisma.assetType) throw new Error("Model for Type not found");

  const created = await prisma.assetType.create({
    data: { name, description },
    select: { id: true, name: true, description: true },
  });

  revalidatePath("/admin/AddMasterData");
  return created;
}

export async function addLocationAction(input: {
  building: string;
  room: string;
  floor?: string | null;
  description?: string | null;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");

  const building = (input?.building ?? "").trim();
  const room = (input?.room ?? "").trim();
  const floor = input?.floor?.trim() || null;
  const description = input?.description?.toString().trim() || null;

  if (!building || !room) throw new Error("building and room are required");
  if (!prisma.location?.create) throw new Error("Model for Location not found");

  const created = await prisma.location.create({
    data: { building, room, floor, description },
    select: {
      id: true,
      building: true,
      room: true,
      floor: true,
      description: true,
    },
  });

  revalidatePath("/admin/AddMasterData");
  return created;
}

export async function updateTypeAction(input: {
  id: string;
  name: string;
  description?: string | null;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");
  const id = String(input?.id || "");
  if (!id) throw new Error("id is required");

  const name = (input?.name ?? "").trim();
  const description = input?.description?.toString().trim() || null;
  if (!name) throw new Error("name is required");

  if (!prisma.assetType) throw new Error("Model for Type not found");

  const updated = await prisma.assetType.update({
    where: { id },
    data: { name, description },
    select: { id: true, name: true, description: true },
  });

  revalidatePath("/admin/AddMasterData");
  return updated;
}

export async function updateLocationAction(input: {
  id: string;
  building: string;
  room: string;
  floor?: string | null;
  description?: string | null;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");
  const id = String(input?.id || "");
  if (!id) throw new Error("id is required");

  const building = (input?.building ?? "").trim();
  const room = (input?.room ?? "").trim();
  const floor = input?.floor?.trim() || null;
  const description = input?.description?.toString().trim() || null;

  if (!building || !room) throw new Error("building and room are required");
  if (!prisma.location?.update) throw new Error("Model for Location not found");

  const updated = await prisma.location.update({
    where: { id },
    data: { building, room, floor, description },
    select: {
      id: true,
      building: true,
      room: true,
      floor: true,
      description: true,
    },
  });

  revalidatePath("/admin/AddMasterData");
  return updated;
}

export async function deleteTypeAction(input: { id: string }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");

  const id = String(input?.id || "");
  if (!id) throw new Error("id is required");

  if (!prisma.assetType) throw new Error("Model for Type not found");

  await prisma.assetType.delete({ where: { id } });
  revalidatePath("/admin/AddMasterData");
  return { ok: true as const };
}

export async function deleteLocationAction(input: { id: string }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");

  const id = String(input?.id || "");
  if (!id) throw new Error("id is required");

  if (!prisma.location?.delete) throw new Error("Model for Location not found");
  await prisma.location.delete({ where: { id } });
  revalidatePath("/admin/AddMasterData");
  return { ok: true as const };
}