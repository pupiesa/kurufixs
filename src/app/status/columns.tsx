"use client";
import { ColumnDef } from "@tanstack/react-table";
import type { ReportRow } from "./page";

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
];
