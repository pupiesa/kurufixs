import prisma from "@/lib/db";

export default async function Home() {
  const asset = await prisma.asset.findMany({
    where: {},
  });
  return (
    <div className="variant-muted color-muted font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20">
      {asset.map((item: { id: string; assetName: string }) => (
        <div key={item.id} className="text-center">
          <h2 className="text-2xl font-bold">{item.assetName}</h2>
        </div>
      ))}
    </div>
  );
}
