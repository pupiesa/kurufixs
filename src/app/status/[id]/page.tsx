import { SquareArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/db";

interface StatusDetailPageProps {
  params: Promise<{ id: string }>;
}

export const runtime = "nodejs";

export default async function StatusDetailPage({
  params,
}: StatusDetailPageProps) {
  const { id } = await params;

  const status = await prisma.repairReport.findUnique({
    where: { id },
    select: {
      id: true,
      issueTitle: true,
      issueDescription: true,
      urgency: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      asset: {
        select: {
          assetName: true,
          location: { select: { room: true, building: true } },
        },
      },
    },
  });

  if (!status) return notFound();
  const location = status.asset?.location;
  return (
    <div className="container mx-auto py-10">
      <Button>
        <SquareArrowLeft />
        <Link href="/status">Back to Status List</Link>
      </Button>
      <div>{status.id}</div>
      <div>{status.asset?.assetName}</div>
      <div>{`${location?.building ?? ""}${location?.room ?? ""}`}</div>
      <div>{status.issueTitle}</div>
      <div>{status.issueDescription}</div>
      <div>{status.urgency}</div>
      <div>{status.createdAt.toLocaleString()}</div>
      <div>{status.updatedAt.toLocaleString()}</div>
      <div>{status.status}</div>
    </div>
  );
}
