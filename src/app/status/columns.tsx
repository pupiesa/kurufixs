"use client";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReportRow } from "./page";

/** ========== Status Pill (4 สถานะตามรูป) ========== */
function StatusPill({ status }: { status: string }) {
  const s = (status || "").toLowerCase().trim().replace(/\s+|-+/g, "_");

  type Theme = { badge: string; dot: string; label: string };
  const THEME: Record<"pending" | "in_progress" | "fixed" | "closed", Theme> = {
    pending: {
      // 🟠 เหลืองส้ม
      badge: "bg-amber-500/10 text-amber-300 border-amber-500/40",
      dot: "bg-amber-500",
      label: "Pending",
    },
    in_progress: {
      // 🔵 น้ำเงิน
      badge: "bg-blue-500/10 text-blue-300 border-blue-500/40",
      dot: "bg-blue-500",
      label: "In Progress",
    },
    fixed: {
      // 🟢 เขียว
      badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
      dot: "bg-emerald-500",
      label: "Fixed",
    },
    closed: {
      // ⚫ เทาเข้ม
      badge: "bg-zinc-500/10 text-zinc-300 border-zinc-500/40",
      dot: "bg-zinc-400",
      label: "Closed",
    },
  };

  // รองรับชื่อที่อาจเคยใช้ (คงการทำงานเดิม)
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

  const key = (THEME as any)[s]
    ? (s as keyof typeof THEME)
    : (ALIAS[s] ?? "pending");

  const theme = THEME[key];

  return (
    <Badge
      variant="outline"
      className={`border ${theme.badge} inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium`}
      aria-label={`Status: ${theme.label}`}
    >
      <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
      {theme.label}
    </Badge>
  );
}

export const columns: ColumnDef<ReportRow>[] = [
  { accessorKey: "assetName", header: "Asset" },
  { accessorKey: "room", header: "Room" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusPill status={(getValue<string>() ?? "").toString()} />,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => new Date(getValue<Date>()).toLocaleString(),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ getValue }) => new Date(getValue<Date>()).toLocaleString(),
  },
  {
    id: "detail",
    header: "Detail",
    cell: ({ row }) => (
      <Button asChild size="sm" variant="outline">
        <Link href={`/status/${row.original.id}`}>View</Link>
      </Button>
    ),
  },
];
