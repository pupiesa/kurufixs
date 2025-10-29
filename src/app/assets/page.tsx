"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Ensure Prisma runs on Node and always fetch fresh data
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { AssetTable } from "./asset-table";

export type AssetRow = {
  id: string;
  assetName: string;
  location: string;
  status: string;
  assetCode: string;
  type: string;
};

async function getData(): Promise<AssetRow[]> {
  const asset = await prisma.asset.findMany({
    select: {
      id: true,
      assetCode: true,
      assetName: true,
      brand: true,
      model: true,
      serialNo: true,
      purchaseDate: true,
      status: { select: { name: true } },
      location: { select: { room: true, building: true } },
      type: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return asset.map((r) => ({
    id: r.id,
    assetCode: r.assetCode,
    assetName: r.assetName,
    brand: r.brand,
    model: r.model,
    serialNo: r.serialNo,
    purchaseDate: r.purchaseDate,
    location: `${r.location?.building ?? ""} ${r.location?.room ?? "-"}`,
    status: r.status?.name ?? "",
    type: r.type?.name ?? "",
  }));
}

export default async function AssetPage() {
  const session = await auth();
  const userRole = session?.user?.role;
  const data = await getData();
  return (
    <div className="container mx-auto py-10 px-5">
      <AssetTable data={data} userRole={userRole} />
    </div>
  );
}
