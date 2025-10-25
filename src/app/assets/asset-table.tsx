"use client";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { AssetRow } from "./page";
import { Trash2 } from "lucide-react";
import { EditDialog } from "./edit-dialog";

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
  const columns = [...baseColumns];
  if (userRole === "admin") {
    columns.push({
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {/* Edit button (opens dialog) */}
          <EditDialog data={row.original} />
          {/* Delete / destructive action - TODO: wire to server delete action */}
          <Button variant="destructive" size="sm">
            <Trash2 />
          </Button>
        </div>
      ),
    });
  }

  return <DataTable columns={columns} data={data} />;
}
