// src/app/admin/AddMasterData/page.tsx
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as DB from "@/lib/db";

const prisma: any =
  (DB as any).prisma ?? (DB as any).default ?? (DB as any).db ?? DB;

import ClientUI from "./ClientUI";

export const metadata = {
  title: "Admin • Selection management",
  description: "Manage selectable data (Type, Location) — admin only",
};

export default async function Page() {
  const session = await auth();
  const role = (session?.user as any)?.role ?? null;
  if (role !== "admin") redirect("/");

  const initialTypes = await getTypesSSR();
  const initialLocs = await getLocationsSSR();

  return (
    <ClientUI
      initialTypes={initialTypes}
      initialLocs={initialLocs}
      onAddType={addTypeAction}
      onAddLocation={addLocationAction}
      onEditType={updateTypeAction}
      onEditLocation={updateLocationAction}
      onDeleteType={deleteTypeAction}
      onDeleteLocation={deleteLocationAction}
    />
  );
}

/* ---------------- SSR helpers ---------------- */
async function getTypesSSR() {
  try {
    if (prisma.assetType?.findMany) {
      return await prisma.assetType.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, description: true },
      });
    }
  } catch {}
  try {
    if (prisma.type?.findMany) {
      return await prisma.type.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, description: true },
      });
    }
  } catch {}
  return [];
}

async function getLocationsSSR() {
  try {
    if (prisma.location?.findMany) {
      return await prisma.location.findMany({
        orderBy: [{ building: "asc" }, { room: "asc" }],
        select: {
          id: true,
          building: true,
          room: true,
          floor: true,
          description: true,
        },
      });
    }
  } catch {}
  return [];
}

/* ---------------- Server Actions ---------------- */
export async function addTypeAction(input: {
  name: string;
  description?: string | null;
}) {
  "use server";
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");

  const name = (input?.name ?? "").trim();
  const description = input?.description?.toString().trim() || null;
  if (!name) throw new Error("name is required");

  const client = prisma.assetType?.create ? prisma.assetType : prisma.type;
  if (!client?.create) throw new Error("Model for Type not found");

  const created = await client.create({
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
  "use server";
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
  "use server";
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");
  const id = String(input?.id || "");
  if (!id) throw new Error("id is required");

  const name = (input?.name ?? "").trim();
  const description = input?.description?.toString().trim() || null;
  if (!name) throw new Error("name is required");

  const client = prisma.assetType?.update ? prisma.assetType : prisma.type;
  if (!client?.update) throw new Error("Model for Type not found");

  const updated = await client.update({
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
  "use server";
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
  "use server";
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");

  const id = String(input?.id || "");
  if (!id) throw new Error("id is required");

  const client = prisma.assetType?.delete ? prisma.assetType : prisma.type;
  if (!client?.delete) throw new Error("Model for Type not found");

  await client.delete({ where: { id } });
  revalidatePath("/admin/AddMasterData");
  return { ok: true as const };
}

export async function deleteLocationAction(input: { id: string }) {
  "use server";
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") throw new Error("Unauthorized");

  const id = String(input?.id || "");
  if (!id) throw new Error("id is required");

  if (!prisma.location?.delete) throw new Error("Model for Location not found");
  await prisma.location.delete({ where: { id } });
  revalidatePath("/admin/AddMasterData");
  return { ok: true as const };
}
