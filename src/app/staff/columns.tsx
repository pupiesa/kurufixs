"use client";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AssetRow } from "./page";

/* ===================== Ticket Status Pill (UI only) ===================== */

type TVariant = "amber" | "blue" | "emerald" | "violet" | "red" | "zinc";

const TICKET_PILL: Record<TVariant, { wrap: string; dot: string }> = {
  amber: {
    wrap:
      "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 " +
      "dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  blue: {
    wrap:
      "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200 " +
      "dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800",
    dot: "bg-blue-500 dark:bg-blue-400",
  },
  emerald: {
    wrap:
      "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 " +
      "dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800",
    dot: "bg-emerald-500 dark:bg-emerald-400",
  },
  violet: {
    wrap:
      "bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-200 " +
      "dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-800",
    dot: "bg-violet-500 dark:bg-violet-400",
  },
  red: {
    wrap:
      "bg-red-100 text-red-700 ring-1 ring-inset ring-red-200 " +
      "dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800",
    dot: "bg-red-500 dark:bg-red-400",
  },
  zinc: {
    wrap:
      "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200 " +
      "dark:bg-zinc-900/30 dark:text-zinc-300 dark:ring-zinc-800",
    dot: "bg-zinc-500 dark:bg-zinc-400",
  },
};

function pickTicketVariant(raw: string): TVariant {
  const s = (raw || "").toLowerCase().trim();

  if (/(^|[\s_])pending($|[\s_])|open|awaiting/.test(s)) return "amber";
  if (/in[\s_-]*progress|assigned|processing|working|wip/.test(s)) return "blue";
  if (/fixed|resolved|done|complete(d)?/.test(s)) return "emerald";
  if (/on[\s_-]*hold|hold|paused|deferred|snoozed/.test(s)) return "violet";
  if (/overdue|escalated|failed|error|critical/.test(s)) return "red";
  if (/closed|cancelled|canceled|void/.test(s)) return "zinc";
  return "zinc";
}

function toPrettyLabel(s: string) {
  return (s || "-")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function TicketStatusPill({ status }: { status: string }) {
  const variant = pickTicketVariant(status);
  const cls = TICKET_PILL[variant];
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium " +
        "transition-colors " +
        cls.wrap
      }
      title={status}
    >
      <span className={"h-1.5 w-1.5 rounded-full " + cls.dot} />
      {toPrettyLabel(status)}
    </span>
  );
}


export const columns: ColumnDef<AssetRow>[] = [
  { accessorKey: "assetCode", header: "Asset Code" },
  { accessorKey: "assetName", header: "Asset Name" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "urgency", header: "Urgency" },
  { accessorKey: "location", header: "Location" },

  {
    accessorKey: "ticketStatus",
    header: "Ticket Status",
    cell: ({ getValue }) => {
      const v = (getValue<string>() ?? "").toString();
      return <TicketStatusPill status={v} />;
    },
  },

  {
    id: "detail",
    header: "Detail",
    cell: ({ row }) => (
      <Button asChild size="sm" variant="outline">
        <Link href={`/staff/${row.original.id}`}>View</Link>
      </Button>
    ),
  },
];
