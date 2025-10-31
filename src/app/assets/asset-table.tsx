"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { EditDialog } from "./edit-dialog";
import type { AssetRow } from "./page";

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

interface AssetTableProps {
  data: AssetRow[];
  userRole: string | null | undefined;
}

export function AssetTable({ data, userRole }: AssetTableProps) {
  const [localData, setLocalData] = React.useState<AssetRow[]>(data ?? []);

  // Keep localData in sync when parent passes updated data (e.g., after page refresh)
  React.useEffect(() => {
    setLocalData(data ?? []);
  }, [data]);
  const columns = [...baseColumns];
  if (userRole === "admin") {
    columns.push({
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {/* Edit button (opens dialog) */}
          <EditDialog data={row.original} />
          {/* Delete / destructive action */}
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
                  // remove from local UI
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

  return <DataTable columns={columns} data={localData} />;
}
