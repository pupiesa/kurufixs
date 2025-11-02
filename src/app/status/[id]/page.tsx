import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SquareArrowLeft, MapPin, Tag, CalendarClock } from "lucide-react";

export const runtime = "nodejs";

/* ---------- Status Pill (4 สถานะตามรูป) ---------- */
function StatusPill({ status }: { status: string }) {
  const s = (status || "").toLowerCase().trim().replace(/\s+|-+/g, "_");

  const THEME = {
    pending: {
      badge: "bg-amber-500/10 text-amber-300 border-amber-500/40",
      dot: "bg-amber-500",
      label: "Pending",
    },
    in_progress: {
      badge: "bg-blue-500/10 text-blue-300 border-blue-500/40",
      dot: "bg-blue-500",
      label: "In Progress",
    },
    fixed: {
      badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
      dot: "bg-emerald-500",
      label: "Fixed",
    },
    closed: {
      badge: "bg-zinc-500/10 text-zinc-300 border-zinc-500/40",
      dot: "bg-zinc-400",
      label: "Closed",
    },
  } as const;

  const ALIAS: Record<string, keyof typeof THEME> = {
    open: "in_progress",
    inprogress: "in_progress",
    resolved: "fixed",
    done: "fixed",
    complete: "fixed",
    completed: "fixed",
    cancelled: "closed",
    canceled: "closed",
    reject: "closed",
    rejected: "closed",
    on_hold: "pending",
    hold: "pending",
  };

  const key = (s in THEME ? s : (ALIAS[s] ?? "pending")) as keyof typeof THEME;
  const t = THEME[key];

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
    HIGH: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    MEDIUM: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    LOW: "bg-zinc-500/15 text-zinc-300 border-zinc-500/40",
  };
  const cls = MAP[u] ?? "bg-zinc-500/15 text-zinc-300 border-zinc-500/40";
  return (
    <span className={`inline-flex items-center rounded-full border ${cls} px-2 py-0.5 text-[11px] font-medium`}>
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
  params: Promise<{ id: string }>; // ✅ ต้อง await ตาม error เดิม
}

export default async function StatusDetailPage({ params }: PageProps) {
  const { id } = await params; // ✅ await ก่อนใช้

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
              <div className="font-medium leading-snug">{item.issueTitle || "-"}</div>
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
