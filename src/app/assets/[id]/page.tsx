import {
  SquareArrowLeft,
  Package2,
  MapPin,
  Ban,
  Tag,
  Calendar,
  CircleDollarSign,
  AlertCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import prisma from "@/lib/db";

interface AssetDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({
  params,
}: AssetDetailPageProps) {
  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      location: true,
      status: true,
      type: true,
      staff: true,
      RepairReport: {
        include: {
          activities: true,
        },
        orderBy: {
          reportedAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!asset) return notFound();

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl px-4">
      <Button asChild className="mb-6">
        <Link href="/assets">
          <SquareArrowLeft className="mr-2 h-4 w-4" />
          Back to Asset List
        </Link>
      </Button>

      <div className="grid gap-6">
        {/* Main Asset Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Package2 className="h-6 w-6" />
                {asset.assetName}
              </CardTitle>
              <Badge
                variant={
                  asset.status?.name === "IN_USE" ? "default" : "destructive"
                }
              >
                {asset.status?.name}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Asset Code: {asset.assetCode}
            </div>
          </CardHeader>
          <CardContent className="mx-auto">
            <div className="grid gap-8 md:grid-cols-2 md:gap-22">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Type:</span>{" "}
                    {asset.type?.name || "-"}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Location:</span>{" "}
                    {asset.location
                      ? `Building ${asset.location.building}, Room ${
                          asset.location.room
                        }, Floor ${asset.location.floor || "-"}`
                      : "-"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Serial Number:</span>{" "}
                    {asset.serialNo || "-"}
                  </div>
                </div>
              </div>

              {/* Purchase & Warranty */}
              <div className="space-y-4">
                <h3 className="font-semibold">Purchase & Warranty</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Purchase Date:</span>{" "}
                    {formatDate(asset.purchaseDate)}
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Price:</span>{" "}
                    {formatCurrency(Number(asset.price))}
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Warranty Until:</span>{" "}
                    {formatDate(asset.warrantyExp)}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mt-6">
              <Separator className="my-4" />
              <div className="space-y-4">
                <h3 className="font-semibold">Additional Details</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Brand:</span>{" "}
                    {asset.brand || "-"}
                    <span className="mx-2">•</span>
                    <span className="font-medium">Model:</span>{" "}
                    {asset.model || "-"}
                  </div>
                  {asset.staff && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Assigned to:</span>{" "}
                      {asset.staff.fullName}
                      {asset.staff.position && ` (${asset.staff.position})`}
                    </div>
                  )}
                  {asset.note && (
                    <div className="flex gap-2 mt-2">
                      <FileText className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Notes:</span>
                        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                          {asset.note}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Repair History */}
        {asset.RepairReport && asset.RepairReport.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Repair History</CardTitle>
            </CardHeader>
            <CardContent className="px-10">
              <div className="flex flex-row gap-x-5">
                {asset.RepairReport.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{report.issueTitle}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.issueDescription}
                        </p>
                      </div>
                      <Badge
                        variant={
                          report.status === "FIXED"
                            ? "default"
                            : report.status === "IN_PROGRESS"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Reported:{" "}
                      {new Date(report.reportedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
