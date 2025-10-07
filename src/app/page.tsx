import prisma from "@/lib/db";
import Cards from "@/components/Cards";
import Cards2 from "@/components/Cards2";
export default async function Home() {
  const asset = await prisma.asset.findMany();
  return (
    <div className="variant-muted color-muted font-sans">
      <h6 className="text-4xl font-bold">Dashboard</h6>
      <div className="flex flex-col w-full items-center">
        <div className="flex flex-col w-96 px-10 sm:w-full sm:flex-row justify-between bg-amber-200 my-5 gap-2">
          <div className="basis-full">
            <Cards />
          </div>
          <div className="basis-full">
            <Cards />
          </div>
          <div className="basis-full">
            <Cards />
          </div>
        </div>
      </div>
      {/* section 2 */}
      <div className="flex justify-around bg-amber-200 my-5 px-5 gap-5 h-96">
        <div className="bg-green-900 basis-1/2 border-2 border-blue-700">
          <Cards2 />
        </div>
        <div className="bg-green-900 basis-1/2 border-2 border-blue-700">
          <Cards2 />
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
