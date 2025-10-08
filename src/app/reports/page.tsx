import Reportform from "@/components/reportform";
import { prisma } from "@/lib/db";

export default async function ReportsPage() {
  const assets = await prisma.asset.findMany({
    select: { id: true, assetCode: true, assetName: true },
    orderBy: { assetCode: "asc" },
  });

  return (
    <div className="h-full flex justify-center mt-10 items-center w-full px-4">
      <div className="w-full max-w-2xl">
        <Reportform assets={assets} />
      </div>
    </div>
  );
}
