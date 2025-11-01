import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SquareArrowLeft, MapPin, Tag, CalendarClock } from "lucide-react";

export const runtime = "nodejs";

/* ---------- Pills ---------- */
function StatusPill({ status }: { status: string }) {
  const s = (status || "")
    .toLowerCase()
    .trim()
    .replace(/\s+|-+/g, "_");
  const THEME: Record<string, { badge: string; dot: string; label: string }> = {
    pending: {
      badge: "bg-amber-500/15 text-amber-700 border-amber-400/30",
      dot: "bg-amber-500",
      label: "Pending",
    },
    open: {
      badge: "bg-blue-500/15 text-blue-700 border-blue-400/30",
      dot: "bg-blue-500",
      label: "Open",
    },
    in_progress: {
      badge: "bg-sky-500/15 text-sky-700 border-sky-400/30",
      dot: "bg-sky-500",
      label: "In Progress",
    },
    on_hold: {
      badge: "bg-yellow-500/15 text-yellow-700 border-yellow-400/30",
      dot: "bg-yellow-500",
      label: "On Hold",
    },
    resolved: {
      badge: "bg-emerald-500/15 text-emerald-700 border-emerald-400/30",
      dot: "bg-emerald-500",
      label: "Resolved",
    },
    closed: {
      badge: "bg-slate-500/15 text-slate-700 border-slate-400/30",
      dot: "bg-slate-500",
      label: "Closed",
    },
    cancelled: {
      badge: "bg-rose-500/15 text-rose-700 border-rose-400/30",
      dot: "bg-rose-500",
      label: "Cancelled",
    },
    rejected: {
      badge: "bg-rose-500/15 text-rose-700 border-rose-400/30",
      dot: "bg-rose-500",
      label: "Rejected",
    },
    approved: {
      badge: "bg-green-500/15 text-green-700 border-green-400/30",
      dot: "bg-green-500",
      label: "Approved",
    },
  };
  const t = THEME[s] ?? THEME.open;

  return (
    <Badge
      variant="outline"
      className={`border ${t.badge} inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium`}
      aria-label={`Status: ${t.label}`}
    >
      <span className={`h-2 w-2 rounded-full ${t.dot}`} />
      {t.label}
    </Badge>
  );
}

function UrgencyPill({ urgency }: { urgency?: string | null }) {
  const u = (urgency || "").toUpperCase().trim();
  const MAP: Record<string, string> = {
    HIGH: "bg-rose-500/15 text-rose-600 border-rose-400/30",
    MEDIUM: "bg-amber-500/15 text-amber-700 border-amber-400/30",
    LOW: "bg-slate-500/15 text-slate-600 border-slate-400/30",
  };
  const cls = MAP[u] ?? "bg-slate-500/15 text-slate-600 border-slate-400/30";
  return (
    <span
      className={`inline-flex items-center rounded-full border ${cls} px-2 py-0.5 text-[11px] font-medium`}
    >
      {u || "-"}
    </span>
  );
}

function fmtDate(d?: Date | string | null) {
  if (!d) return "-";
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dt);
}

/* ---------- Page ---------- */
interface PageProps {
  params: Promise<{ id: string }>; // ✅ ต้อง await ตาม error ที่เจอ
}

export default async function StatusDetailPage({ params }: PageProps) {
  const { id } = await params; // ✅ แก้ error: await ก่อนใช้

  const item = await prisma.repairReport.findUnique({
    where: { id },
    select: {
      id: true,
      issueTitle: true,
      issueDescription: true,
      urgency: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      asset: {
        select: {
          assetName: true,
          location: { select: { room: true, building: true } },
        },
      },
    },
  });

  if (!item) return notFound();

  const building = item.asset?.location?.building ?? "";
  const room = item.asset?.location?.room ?? "";
  const locationText = [building, room].filter(Boolean).join(" ");

  return (
    <div className="container mx-auto max-w-3xl py-8">
      {/* Back */}
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/status" className="inline-flex items-center gap-2">
            <SquareArrowLeft className="h-4 w-4" />
            Back to Status List
          </Link>
        </Button>
      </div>

      {/* Main Card */}
      <Card className="rounded-2xl border border-border/60 shadow-sm mx-5">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold tracking-tight">
              รายการแจ้งซ่อม
            </CardTitle>
            <StatusPill status={item.status} />
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono">ID: {item.id}</span>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="py-y space-y-6 mx-auto">
          {/* Title + Asset */}
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Title</div>
              <div className="font-medium leading-snug">
                {item.issueTitle || "-"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Asset</div>
              <div>{item.asset?.assetName ?? "-"}</div>
            </div>
          </div>

          {/* Badges Row */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Location
              </div>
              <div>{locationText || "-"}</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                Urgency
              </div>
              <div>
                <UrgencyPill urgency={item.urgency} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                Updated
              </div>
              <div>{fmtDate(item.updatedAt)}</div>
            </div>
          </div>

          <Separator />

          {/* Description block */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Description</div>
            <div className="rounded-lg border bg-muted/10 p-3 text-sm leading-relaxed">
              {item.issueDescription || "-"}
            </div>
          </div>

          {/* Times */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Created</div>
              <div>{fmtDate(item.createdAt)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Last Updated</div>
              <div>{fmtDate(item.updatedAt)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
