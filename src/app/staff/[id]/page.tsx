import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateTicketAction } from "@/app/actions/actions";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { SquareArrowLeft } from "lucide-react";
import Link from "next/link";

export const runtime = "nodejs";

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  const session = await auth();

  const ticket = await prisma.repairReport.findUnique({
    where: { id },
    include: {
      asset: {
        include: {
          location: true,
          status: true,
          type: true,
        },
      },
      reporter: true,
      assignedStaff: true,
      activities: {
        include: { actorUser: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ticket) return notFound();

  const statusOptions = ["PENDING", "IN_PROGRESS", "FIXED", "CLOSED"];
  const urgencyColor = {
    LOW: "bg-blue-100 text-blue-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-red-100 text-red-800",
  };

  return (
    <div className="container mx-auto py-5 max-w-lg">
      <Button>
        <SquareArrowLeft />
        <Link href="/staff">Back to Ticket list</Link>
      </Button>
      <Card className="flex justify-center items-center">
        <CardHeader className="self-start">
          <CardTitle className="text-2xl">
            Ticket #{ticket.id.slice(0, 8)}
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge className={urgencyColor[ticket.urgency]}>
              {ticket.urgency}
            </Badge>
            <Badge variant="outline">{ticket.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Issue Details */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Issue Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Title:</span> {ticket.issueTitle}
              </div>
              <div>
                <span className="font-medium">Description:</span>{" "}
                {ticket.issueDescription}
              </div>
              {ticket.issueCategory && (
                <div>
                  <span className="font-medium">Category:</span>{" "}
                  {ticket.issueCategory}
                </div>
              )}
              <div>
                <span className="font-medium">Reported:</span>{" "}
                {ticket.reportedAt.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Asset Details */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Asset Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Asset:</span>{" "}
                {ticket.asset.assetName} ({ticket.asset.assetCode})
              </div>
              <div>
                <span className="font-medium">Type:</span>{" "}
                {ticket.asset.type?.name ?? "-"}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                {ticket.asset.status?.name ?? "-"}
              </div>
              {ticket.asset.location && (
                <div>
                  <span className="font-medium">Location:</span>{" "}
                  {ticket.asset.location.building} {ticket.asset.location.room}
                </div>
              )}
            </div>
          </div>

          {/* Reporter */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Reporter</h3>
            <div className="space-y-1 text-sm">
              <div>{ticket.reporterName}</div>
              <div className="text-muted-foreground">
                {ticket.reporterEmail}
              </div>
              {ticket.reporterPhone && <div>{ticket.reporterPhone}</div>}
            </div>
          </div>

          {/* Activity Log */}
          {ticket.activities.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Activity Log</h3>
              <div className="space-y-2">
                {ticket.activities.map((log) => (
                  <div
                    key={log.id}
                    className="border-l-2 border-muted pl-4 py-2 text-sm"
                  >
                    <div className="text-muted-foreground text-xs">
                      {log.createdAt.toLocaleString()} -{" "}
                      {log.actorUser?.name ?? "System"}
                    </div>
                    <div>{log.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update Form */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Update Ticket</h3>
            <form action={updateTicketAction} className="space-y-4">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <div>
                <label className="font-medium text-sm mb-2 block">
                  New Status
                </label>
                <Select name="status" defaultValue={ticket.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-medium text-sm mb-2 block">
                  Activity Message
                </label>
                <Textarea
                  name="message"
                  placeholder="Describe the changes or updates..."
                  className="min-h-24"
                />
              </div>
              <Button type="submit">Update Ticket</Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
