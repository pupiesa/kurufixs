import { prisma } from "@/lib/db";
import { columns } from "@/app/status/columns";
import { DataTable } from "@/components/data-table";

export type ReportRow = {
  id: string;
  assetName: string;
  room: string | null;
  status: string;
  createdAt: Date;
};

async function getData(): Promise<ReportRow[]> {
  const reports = await prisma.repairReport.findMany({
    select: {
      id: true,
      status: true,
      createdAt: true,
      asset: {
        select: {
          assetName: true,
          location: { select: { room: true, building: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  console.log(reports);
  return reports.map((r) => ({
    id: r.id,
    assetName: r.asset?.assetName ?? "-",
    room: r.asset?.location?.room ?? null,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

export default async function StatusPage() {
  const data = await getData();
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
