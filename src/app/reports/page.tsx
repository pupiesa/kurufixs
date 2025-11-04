import Reportform from "@/components/reportform";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function RepairReport() {
  const assets = await prisma.asset.findMany({
    select: { id: true, assetCode: true, assetName: true },
  });

  return (
    <main className="w-full">
      <div className="mx-auto w-full max-w-3xl px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
        <div className="w-full rounded-2xl border-2 border-foreground/70 bg-background/50 shadow-sm p-3 sm:p-5">
          <Reportform assets={assets} />
        </div>
      </div>
    </main>
  );
}
