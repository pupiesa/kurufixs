import Cards3 from "@/components/dashboard/Card3";
import Cards from "@/components/dashboard/Cards";
import Cards2 from "@/components/dashboard/Cards2";
import prisma from "@/lib/db";
import { ReportStatus, Urgency } from "@prisma/client";

// Render this page on Node and always fetch fresh data from the DB.
export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function Home() {
  const assetsCount = await prisma.asset.count();

  const underRepairCount = await prisma.repairReport.count({
    where: { status: { in: [ReportStatus.PENDING, ReportStatus.IN_PROGRESS] } },
  });

  const urgentCount = await prisma.repairReport.count({
    where: {
      urgency: Urgency.HIGH,
      status: { in: [ReportStatus.PENDING, ReportStatus.IN_PROGRESS] },
    },
  });

  return (
    <main className="w-full">
      {/* container: 4" mobile up to large desktop */}
      <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 lg:px-6 py-3 sm:py-6">
        {/* top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <Cards
            total={assetsCount}
            title="Total Assets"
            desc="Overall registered devices"
          />
          <Cards
            total={underRepairCount}
            title="Under Repair"
            desc="Currently being serviced"
          />
          <Cards
            total={urgentCount}
            variant="urgent"
            title="Urgent Repairs"
            desc="High urgency (pending / in progress)"
          />
        </div>

        {/* lower section: auto stacks on small screens */}
        <div className="mt-3 sm:mt-6 grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-4">
          <div className="w-full">
            <Cards2 />
          </div>
          <div className="w-full">
            <Cards3 />
          </div>
        </div>
      </div>
    </main>
  );
}
