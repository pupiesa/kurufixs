import { columns } from "@/app/staff/columns";
import { DataTable } from "@/components/data-table";
import { prisma } from "@/lib/db";

export type AssetRow = {
  id: string; // ticket ID
  assetName: string;
  location: string;
  status: string;
  urgency: string;
  assetCode: string;
  ticketStatus: string;
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
    where: {
      NOT: { RepairReport: { none: {} } },
    },
    orderBy: { createdAt: "desc" },
  });
  const ticket = await prisma.repairReport.findMany();
  console.log(asset);
  return ticket.map((t) => {
    const assetItem = asset.find((a) => a.id === t.assetId);
    return {
      id: t.id, // ticket ID, not asset ID
      assetCode: assetItem?.assetCode ?? "",
      assetName: assetItem?.assetName ?? "",
      urgency: t.urgency,
      location: `${assetItem?.location?.building ?? ""} ${
        assetItem?.location?.room ?? "-"
      }`,
      status: assetItem?.status?.name ?? "",
      ticketStatus: t.status ?? "ไม่มีรายงาน",
    };
  });
}

export default async function AssetPage() {
  const data = await getData();
  return (
    <div className="container mx-auto py-10 px-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
