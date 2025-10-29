import Cards3 from "@/components/dashboard/Card3";
import Cards from "@/components/dashboard/Cards";
import Cards2 from "@/components/dashboard/Cards2";
import prisma from "@/lib/db";

// Render this page on Node and always fetch fresh data from the DB.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function Home() {
  const assets = await prisma.asset.findMany({
    select: { id: true },
  });
  const assetsCount = await prisma.asset.count();
  const status = await prisma.repairReport.findMany({
    select: { status: true },
    where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
  });
  return (
    <div className="variant-muted color-muted font-sans">
      <div className="flex flex-col w-full items-center">
        <div className="flex flex-col w-96 px-10 sm:w-full sm:flex-row justify-between my-5 gap-2">
          <div className="basis-full">
            <Cards
              total={assetsCount}
              title="Total Assets"
              desc="Overall registered devices"
            />
          </div>
          <div className="basis-full">
            <Cards
              total={status.length}
              title="Under Repair"
              desc="Currently being serviced"
            />
          </div>
          <div className="basis-full">
            <Cards
              total={assets.length}
              title="Under Repair"
              desc="Currently being serviced"
            />
          </div>
        </div>
      </div>
      {/* section 2 */}
      <div className="flex flex-col items-center sm:flex-row justify-around mx-5 gap-5 h-96 mt-5 sm:mt-20">
        <div className="basis-1/2 w-85">
          <Cards2 />
        </div>
        <div className="basis-1/2 w-85">
          <Cards3 />
        </div>
      </div>
      {/* {asset.map((item: { id: string; assetName: string }) => (
        <div key={item.id} className="text-center">
          <h2 className="text-2xl font-bold">{item.assetName}</h2>
        </div>
      ))} */}
    </div>
  );
}
