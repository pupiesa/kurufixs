"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Trash2, Search } from "lucide-react";
import Link from "next/link";
import React from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditDialog } from "./edit-dialog";
import type { AssetRow } from "./page";

/* ========== helpers ========== */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toLoosePattern(query: string) {
  const q = query.trim();
  if (!q) return "";
  const chars = [...q].map((ch) => escapeRegExp(ch));
  return `${chars.join("\\s*")}`;
}

/** สีของสถานะ + สีจุด */
function getStatusStyle(raw: string) {
  const v = String(raw ?? "").trim();

  const isInUse = /(ใช้งานอยู่|กำลังใช้งาน|in[\s_-]*use|using)/i.test(v);
  const isBroken = /(ชำรุด|เสีย|พัง|broken|damaged)/i.test(v);
  const isLost = /(สูญหาย|หาย|หาไม่พบ|lost|missing)/i.test(v);

  const isOpen = /(open)/i.test(v);
  const isPending = /(pending|awaiting|รอดำเนินการ)/i.test(v);
  const isInProgress = /(in[\s_-]*progress|กำลังดำเนินการ)/i.test(v);
  const isFixed = /(fixed|resolved|ซ่อมเสร็จ)/i.test(v);
  const isClosed = /(closed|ปิดงาน)/i.test(v);

  // default เทา
  let bg = "bg-zinc-500/15";
  let text = "text-zinc-300";
  let ring = "ring-zinc-500/30";
  let dot = "bg-zinc-300";

  if (isInUse) {
    bg = "bg-emerald-500/15";
    text = "text-emerald-400";
    ring = "ring-emerald-500/30";
    dot = "bg-emerald-400";
  } else if (isBroken) {
    bg = "bg-rose-500/15";
    text = "text-rose-400";
    ring = "ring-rose-500/25";
    dot = "bg-rose-400";
  } else if (isLost || isPending) {
    bg = "bg-amber-500/15";
    text = "text-amber-400";
    ring = "ring-amber-500/25";
    dot = "bg-amber-400";
  } else if (isOpen) {
    bg = "bg-sky-500/15";
    text = "text-sky-400";
    ring = "ring-sky-500/25";
    dot = "bg-sky-400";
  } else if (isInProgress) {
    bg = "bg-cyan-500/15";
    text = "text-cyan-400";
    ring = "ring-cyan-500/25";
    dot = "bg-cyan-400";
  } else if (isFixed) {
    bg = "bg-emerald-500/15";
    text = "text-emerald-400";
    ring = "ring-emerald-500/25";
    dot = "bg-emerald-400";
  } else if (isClosed) {
    bg = "bg-zinc-500/15";
    text = "text-zinc-300";
    ring = "ring-zinc-500/25";
    dot = "bg-zinc-300";
  }

  return { bg, text, ring, dot };
}

/** 🔹 ป้ายสถานะ (มี “จุดสี” นำหน้า) */
function StatusPill({ value }: { value?: string | null }) {
  const raw = String(value ?? "").trim();
  const { bg, text, ring, dot } = getStatusStyle(raw);

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        "ring-1", bg, text, ring,
      ].join(" ")}
      title={raw}
    >
      <span className={["h-2.5 w-2.5 rounded-full", dot].join(" ")} />
      {raw || "-"}
    </span>
  );
}

function HighlightLoose({
  text,
  query,
}: {
  text: string | null | undefined;
  query: string;
}) {
  const value = String(text ?? "");
  const pat = toLoosePattern(query);
  if (!pat) return <>{value}</>;
  const re = new RegExp(`(${pat})`, "ig");

  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(value)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > last) out.push(<span key={`t-${last}`}>{value.slice(last, start)}</span>);
    out.push(
      <mark
        key={`h-${start}`}
        className="rounded px-0.5 bg-sky-600 text-white dark:bg-sky-500"
      >
        {value.slice(start, end)}
      </mark>
    );
    last = end;
    if (re.lastIndex === m.index) re.lastIndex++;
  }
  if (last < value.length) out.push(<span key={`t-end`}>{value.slice(last)}</span>);
  return <>{out}</>;
}

/* ========== table columns ========== */
const baseColumns: ColumnDef<AssetRow>[] = [
  { accessorKey: "assetCode", header: "Asset Code" },
  { accessorKey: "assetName", header: "Asset Name" },
  { accessorKey: "type", header: "Type" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusPill value={String(getValue() ?? "")} />,
  },
  { accessorKey: "location", header: "Location" },
  {
    id: "detail",
    header: "Detail",
    cell: ({ row }) => (
      <Button asChild size="sm" variant="outline">
        <Link href={`/assets/${row.original.id}`}>View</Link>
      </Button>
    ),
  },
];

type SearchField =
  | "all"
  | "assetCode"
  | "assetName"
  | "type"
  | "status"
  | "location";

const FIELD_LABELS: Record<SearchField, string> = {
  all: "All",
  assetCode: "Asset Code",
  assetName: "Asset Name",
  type: "Type",
  status: "Status",
  location: "Location",
};

const FIELD_KEYS: Exclude<SearchField, "all">[] = [
  "assetCode",
  "assetName",
  "type",
  "status",
  "location",
];

interface AssetTableProps {
  data: AssetRow[];
  userRole: string | null | undefined;
}

export function AssetTable({ data, userRole }: AssetTableProps) {
  const [localData, setLocalData] = React.useState<AssetRow[]>(data ?? []);
  const [q, setQ] = React.useState("");
  const [field, setField] = React.useState<SearchField>("all");

  React.useEffect(() => setLocalData(data ?? []), [data]);

  const loosePattern = React.useMemo(() => toLoosePattern(q), [q]);

  const visibleData = React.useMemo(() => {
    if (!loosePattern) return localData;
    const tester = new RegExp(loosePattern, "i");
    return localData.filter((r) => {
      const get = (k: keyof AssetRow) => String((r as any)[k] ?? "");
      if (field === "all") {
        return FIELD_KEYS.some((k) => tester.test(get(k as keyof AssetRow)));
      } else {
        return tester.test(get(field as keyof AssetRow));
      }
    });
  }, [localData, loosePattern, field]);

  const columns = React.useMemo<ColumnDef<AssetRow>[]>(() => {
    const cols: ColumnDef<AssetRow>[] = [...baseColumns];

    if (userRole === "admin") {
      cols.push({
        accessorKey: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <EditDialog data={row.original} />
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!confirm("Delete this asset?")) return;
                try {
                  const res = await fetch(`/api/assets/${row.original.id}`, {
                    method: "DELETE",
                  });
                  if (res.ok) {
                    setLocalData((prev) =>
                      prev.filter((d) => d.id !== row.original.id)
                    );
                  } else {
                    console.error("Failed to delete asset:", await res.json());
                  }
                } catch (err) {
                  console.error("Error deleting asset", err);
                }
              }}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      });
    }

    const highlightKeys = new Set<SearchField>([
      "assetCode",
      "assetName",
      "type",
      "location",
    ]);

    return cols.map((c) => {
      if (
        "accessorKey" in c &&
        typeof c.accessorKey === "string" &&
        highlightKeys.has(c.accessorKey as SearchField)
      ) {
        const origCell = (c as any).cell;

        return {
          ...c,
          cell: (ctx) => {
            const text = String(ctx.getValue() ?? "");
            if (typeof origCell === "function") return origCell(ctx);
            if (origCell !== undefined) return origCell as React.ReactNode;
            return <HighlightLoose text={text} query={q} />;
          },
        } as ColumnDef<AssetRow>;
      }
      return c;
    });
  }, [userRole, q]);

  const CategoryButton = ({ value }: { value: SearchField }) => {
    const active = field === value;
    return (
      <button
        type="button"
        onClick={() => setField(value)}
        aria-pressed={active}
        className={[
          "px-2.5 py-1.5 rounded-full text-xs transition",
          active
            ? "bg-sky-600 text-white shadow ring-1 ring-sky-500"
            : "border border-white/15 dark:border-white/10 text-muted-foreground hover:bg-white/5",
        ].join(" ")}
        title={`Search in ${FIELD_LABELS[value]}`}
      >
        {FIELD_LABELS[value]}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* Top: Search + Category */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full sm:max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${FIELD_LABELS[field]}…`}
              aria-label="Search assets"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQ("");
              }}
              className="pl-8"
            />
          </div>
        </div>

        {/* Category segmented control */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          <CategoryButton value="all" />
          <CategoryButton value="assetCode" />
          <CategoryButton value="assetName" />
          <CategoryButton value="type" />
          <CategoryButton value="status" />
          <CategoryButton value="location" />
        </div>
      </div>

      {/* Result counter */}
      <div className="text-xs text-muted-foreground">
        {visibleData.length} result{visibleData.length === 1 ? "" : "s"}
      </div>

      <DataTable columns={columns} data={visibleData} />
    </div>
  );
}
