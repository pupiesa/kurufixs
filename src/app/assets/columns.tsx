"use client";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AssetRow } from "./page";

export const columns: ColumnDef<AssetRow>[] = [
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
