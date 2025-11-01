"use client";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReportRow } from "./page";

/** ========= Status Pill =========
 * แสดงป้ายสีตามสถานะ (ตัวพิมพ์เล็ก/ใหญ่ได้หมด)
 */
function StatusPill({ status }: { status: string }) {
  const s = (status || "").toLowerCase().trim();

  type Theme = { badge: string; dot: string; label: string };
  const THEME: Record<string, Theme> = {
    pending:     { badge: "bg-amber-500/15 text-amber-700 border-amber-400/30", dot: "bg-amber-500", label: "Pending" },
    open:        { badge: "bg-blue-500/15 text-blue-700 border-blue-400/30",   dot: "bg-blue-500",  label: "Open" },
    in_progress: { badge: "bg-sky-500/15 text-sky-700 border-sky-400/30",      dot: "bg-sky-500",   label: "In Progress" },
    on_hold:     { badge: "bg-yellow-500/15 text-yellow-700 border-yellow-400/30", dot: "bg-yellow-500", label: "On Hold" },
    resolved:    { badge: "bg-emerald-500/15 text-emerald-700 border-emerald-400/30", dot: "bg-emerald-500", label: "Resolved" },
    closed:      { badge: "bg-slate-500/15 text-slate-700 border-slate-400/30", dot: "bg-slate-500", label: "Closed" },
    cancelled:   { badge: "bg-rose-500/15 text-rose-700 border-rose-400/30",   dot: "bg-rose-500",  label: "Cancelled" },
    rejected:    { badge: "bg-rose-500/15 text-rose-700 border-rose-400/30",   dot: "bg-rose-500",  label: "Rejected" },
    approved:    { badge: "bg-green-500/15 text-green-700 border-green-400/30", dot: "bg-green-500", label: "Approved" },
  };

  // รองรับรูปแบบสถานะทั่วไป เช่น "in progress" / "in-progress" / "IN_PROGRESS"
  const key =
    s.replace(/\s+/g, "_").replace(/-+/g, "_") in THEME
      ? (s.replace(/\s+/g, "_").replace(/-+/g, "_") as keyof typeof THEME)
      : ("open" as const);

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

  // 🔵 เปลี่ยนจากตัวหนังสือธรรมดา → เป็นป้ายสี
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const v = (getValue<string>() ?? "").toString();
      return <StatusPill status={v} />;
    },
  },

  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => {
      const d = getValue<Date>();
      return new Date(d).toLocaleString();
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ getValue }) => {
      const d = getValue<Date>();
      return new Date(d).toLocaleString();
    },
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
