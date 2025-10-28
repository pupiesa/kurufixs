import ProgressBar from "@/components/dashboard/ProgressBar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

const Cards = async () => {
  // Fetch count of assets grouped by status
  const statusCounts = await prisma.asset.groupBy({
    by: ["statusId"],
    _count: { id: true },
  });

  // Fetch all status names
  const statuses = await prisma.assetStatus.findMany({
    select: { id: true, name: true },
  });

  // Get total assets for percentage calculation
  const totalAssets = await prisma.asset.count();

  // Map status names to counts and calculate percentages
  const statusData = statuses.map((status) => {
    const count =
      statusCounts.find((sc) => sc.statusId === status.id)?._count.id ?? 0;
    const percentage = totalAssets > 0 ? (count / totalAssets) * 100 : 0;
    return {
      name: status.name,
      count,
      percentage: Math.round(percentage),
    };
  });

  // Color variants for different statuses
  const statusColors: Record<string, string> = {
    ใช้งานอยู่: "bg-green-500",
    ซ่อมบำรุง: "bg-yellow-500",
    ชำรุด: "bg-red-500",
    จำหน่าย: "bg-gray-500",
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Equipment Status Overview</CardTitle>
        <ul className="flex flex-col gap-3">
          {statusData.map((status) => (
            <li
              key={status.name}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{status.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {status.count} ({status.percentage}%)
                  </span>
                </div>
                <div className="w-full">
                  <ProgressBar
                    value={status.percentage}
                    className={statusColors[status.name] || "bg-blue-500"}
                  />
                </div>
              </div>
            </li>
          ))}
          {totalAssets === 0 && (
            <li className="text-sm text-muted-foreground text-center py-4">
              No equipment data available
            </li>
          )}
        </ul>
      </CardHeader>
    </Card>
  );
};

export default Cards;
