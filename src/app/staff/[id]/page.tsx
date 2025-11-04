import { SquareArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTicketAction } from "@/app/actions/actions";
import { Badge } from "@/components/ui/badge";
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
import { prisma } from "@/lib/db";
import { json } from "zod";

export const runtime = "nodejs";

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

// helper: accept string | string[] | null and return clean list of URLs
function parseImageUrls(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return (raw as unknown[])
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;

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

  // try both places — adjust to your actual column location
  const reportImages = parseImageUrls((ticket as any).imageUrl);
  const assetImages = parseImageUrls((ticket.asset as any)?.imageUrl);

  const statusOptions = ["PENDING", "IN_PROGRESS", "FIXED", "CLOSED"];
  const urgencyColor = {
    LOW: "bg-blue-100 text-blue-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-red-100 text-red-800",
  } as const;

  return (
    <div className="container mx-auto py-5 max-w-xl px-3">
      <Button asChild>
        <Link href="/staff">
          <SquareArrowLeft className="mr-2" />
          Back to Ticket list
        </Link>
      </Button>

      <Card className="mt-4">
        <CardHeader className="self-start">
          <CardTitle className="text-xl">Ticket #{ticket.id}</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge
              className={
                urgencyColor[ticket.urgency as keyof typeof urgencyColor]
              }
            >
              {ticket.urgency}
            </Badge>
            <Badge variant="outline">{ticket.status}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-10">
          {/* Issue Details */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Issue Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Title:</span> {ticket.issueTitle}
              </div>
              <div>
                <span className="font-medium">Reported:</span>{" "}
                {ticket.reportedAt.toLocaleString()}
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="font-medium">Description:</span>{" "}
                {ticket.issueDescription}
              </div>
              {ticket.issueCategory && (
                <div>
                  <span className="font-medium">Category:</span>{" "}
                  {ticket.issueCategory}
                </div>
              )}
            </div>

            {/* Report images */}
            {reportImages.length > 0 && (
              <div className="mt-4">
                <div className="font-medium mb-2">Issue Photos</div>
                <div className="grid gap-3">
                  {reportImages.map((src, i) => (
                    <a
                      key={src + i}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                      title="Open full size"
                    >
                      <img
                        src={src}
                        alt={`Issue photo ${i + 1}`}
                        referrerPolicy="no-referrer"
                        className="max-h-40 w-full h-auto aspect-auto object-contain rounded-md border bg-gray-50"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Asset Details */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Asset Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Asset:</span>{" "}
                {ticket.asset.assetName}
              </div>
              <div>
                <span className="font-medium">Code:</span>{" "}
                {ticket.asset.assetCode}
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
                <div className="col-span-1 sm:col-span-2">
                  <span className="font-medium">Location:</span>{" "}
                  {ticket.asset.location.building} {ticket.asset.location.room}
                </div>
              )}
            </div>

            {/* Asset images */}
            {assetImages.length > 0 && (
              <div className="mt-4">
                <div className="font-medium mb-2">Asset Photos</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {assetImages.map((src, i) => (
                    <a
                      key={src + i}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                      title="Open full size"
                    >
                      <img
                        src={src}
                        alt={`Asset photo ${i + 1}`}
                        referrerPolicy="no-referrer"
                        className="max-h-40 w-full h-auto aspect-auto object-contain rounded-md border bg-gray-50"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Update Form */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Update Ticket</h3>
            <form action={updateTicketAction} className="space-y-4">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <div>
                <label
                  htmlFor="status"
                  className="font-medium text-sm mb-2 block"
                >
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
                <label
                  className="font-medium text-sm mb-2 block"
                  htmlFor="message"
                >
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
