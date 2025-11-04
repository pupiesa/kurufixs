import { CircleSmall } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import prisma from "@/lib/db";
import { Badge } from "../ui/badge";

const Cards = async () => {
  const recentTickets = await prisma.repairReport.findMany({
    select: {
      id: true,
      status: true,
      issueTitle: true,
      updatedAt: true,
      asset: {
        select: {
          assetName: true,
          location: { select: { room: true, building: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const statusVariant = {
    PENDING: "destructive",
    IN_PROGRESS: "default",
    FIXED: "secondary",
    CLOSED: "outline",
  } as const;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Status Changes</CardTitle>
        <ul className="flex flex-col gap-3">
          {recentTickets.map((ticket, index) => (
            <li key={ticket.id}>
              <div className="flex items-center justify-between gap-4">
                <CardContent className="p-0 flex-1">
                  <div className="font-medium">{ticket.asset.assetName}</div>
                  <CardDescription>
                    {ticket.asset.location?.building}{" "}
                    {ticket.asset.location?.room ?? "-"}
                  </CardDescription>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ticket.updatedAt.toLocaleDateString()}{" "}
                    {ticket.updatedAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </CardContent>
                <Badge variant={statusVariant[ticket.status] ?? "outline"}>
                  <CircleSmall className="text-foreground fill-foreground rounded-full" />
                  {ticket.status}
                </Badge>
              </div>
              {index < recentTickets.length - 1 && (
                <div className="border-b mt-3" />
              )}
            </li>
          ))}
        </ul>
      </CardHeader>
    </Card>
  );
};

export default Cards;
