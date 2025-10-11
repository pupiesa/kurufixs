import { columns } from "@/app/status/columns";
import { DataTable } from "@/components/data-table";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export type ReportRow = {
  id: string;
  assetName: string;
  room: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

async function getData(userId?: string): Promise<ReportRow[]> {
  const reports = await prisma.repairReport.findMany({
    where: userId ? { reporterId: userId } : undefined,
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      asset: {
        select: {
          assetName: true,
          location: { select: { room: true, building: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return reports.map((r) => ({
    id: r.id,
    assetName: r.asset?.assetName ?? "-",
    room: `${r.asset?.location?.building ?? ""}${
      r.asset?.location?.room ?? ""
    }`,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export default async function StatusPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const data = await getData(userId);

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
