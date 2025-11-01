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

/** ===== helpers ===== */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** สร้างแพทเทิร์นแบบ "ไม่สนช่องว่าง" → a b c  = /a\s*b\s*c/i */
function toLoosePattern(query: string) {
  const q = query.trim();
  if (!q) return "";
  const chars = [...q].map((ch) => escapeRegExp(ch));
  // \s* ระหว่างทุกตัวอักษร เพื่อให้พิมพ์ติด/เว้นวรรคก็แมตช์ได้
  return `${chars.join("\\s*")}`;
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
    // ไฮไลต์พื้นหลังฟ้าเข้ม + "ตัวอักษรสีขาว"
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

/** ===== base columns ===== */
const baseColumns: ColumnDef<AssetRow>[] = [
  { accessorKey: "assetCode", header: "Asset Code" },
  { accessorKey: "assetName", header: "Asset Name" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "status", header: "Status" },
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

  // ใช้ "แพทเทิร์นเดียวกัน" ทั้งกรองและไฮไลต์
  const loosePattern = React.useMemo(() => toLoosePattern(q), [q]);

  const visibleData = React.useMemo(() => {
    if (!loosePattern) return localData;
    const tester = new RegExp(loosePattern, "i"); // ไม่มี g เพื่อเลี่ยง lastIndex side-effect

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
      "status",
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

            // ✅ แก้ TS2349: เรียกเฉพาะกรณี origCell เป็นฟังก์ชัน
            if (typeof origCell === "function") {
              return origCell(ctx);
            }
            // ถ้า origCell เป็นสตริง/ReactNode ให้คืนตามเดิม
            if (origCell !== undefined) {
              return origCell as React.ReactNode;
            }
            // ไม่มี cell เดิม → ใช้ไฮไลต์
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
