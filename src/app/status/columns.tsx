"use client";
import { ColumnDef } from "@tanstack/react-table";
import type { ReportRow } from "./page";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const columns: ColumnDef<ReportRow>[] = [
  { accessorKey: "assetName", header: "Asset" },
  { accessorKey: "room", header: "Room" },
  { accessorKey: "status", header: "Status" },
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
