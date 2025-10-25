import { SquareArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/db";

interface StatusDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StatusDetailPage({
  params,
}: StatusDetailPageProps) {
  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    select: {
      id: true,
      assetName: true,
      location: { select: { room: true, building: true } },
      assetCode: true,
      status: { select: { name: true } },
      type: { select: { name: true } },
    },
  });

  if (!asset) return notFound();
  const location = asset.location;
  return (
    <div className="container mx-auto py-10">
      <Button>
        <SquareArrowLeft />
        <Link href="/assets">Back to Asset List</Link>
      </Button>
      <div>ID: {asset.id}</div>
      <div>Asset Name: {asset.assetName}</div>
      <div>Asset Code: {asset.assetCode}</div>
      <div>
        Location: {`${location?.building ?? ""} ${location?.room ?? ""}`}
      </div>
      <div>Status: {asset.status?.name ?? ""}</div>
      <div>Type: {asset.type?.name ?? ""}</div>
    </div>
  );
}
