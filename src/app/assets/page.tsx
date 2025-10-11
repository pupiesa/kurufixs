import { columns } from "@/app/assets/columns";
import { DataTable } from "@/components/data-table";
import { prisma } from "@/lib/db";

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
      status: { select: { name: true } },
      location: { select: { room: true, building: true } },
      type: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  console.log(asset);
  return asset.map((r) => ({
    id: r.id,
    assetCode: r.assetCode,
    assetName: r.assetName,
    location: `${r.location?.building ?? ""} ${r.location?.room ?? "-"}`,
    status: r.status?.name ?? "",
    type: r.type?.name ?? "",
  }));
}

export default async function AssetPage() {
  const data = await getData();
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
