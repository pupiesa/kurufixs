import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ClientUI from "./ClientUI";
import {
  addTypeAction,
  addLocationAction,
  updateTypeAction,
  updateLocationAction,
  deleteTypeAction,
  deleteLocationAction,
} from "./actions";

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
    return await prisma.assetType.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    });
  } catch {
    return [];
  }
}

async function getLocationsSSR() {
  try {
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
  } catch {
    return [];
  }
}


