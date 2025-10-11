import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      manualAsset,
      assetId,
      assetCodeManual,
      assetNameManual,
      assetTypeName,
      assetStatusName,
      issueTitle,
      issueDescription,
      issueCategory,
      urgency,
      imageUrl,
      reporterId,
      reporterPhone,
    } = body ?? {};

    if (!issueTitle || !issueDescription) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    let finalAssetId: string | null = null;

    if (!manualAsset) {
      if (!assetId)
        return NextResponse.json(
          { message: "กรุณาเลือกครุภัณฑ์หรือกรอกข้อมูล" },
          { status: 400 }
        );
      const asset = await prisma.asset.findUnique({
        where: { id: String(assetId) },
        select: { id: true },
      });
      if (!asset)
        return NextResponse.json(
          { message: "Asset not found" },
          { status: 404 }
        );
      finalAssetId = asset.id;
    } else {
      // Create minimal related records if names provided
      let typeId: string | undefined;
      if (assetTypeName) {
        const type = await prisma.assetType.upsert({
          where: { name: String(assetTypeName) },
          update: {},
          create: { name: String(assetTypeName) },
          select: { id: true },
        });
        typeId = type.id;
      } else {
        // fallback: create/find a generic type
        const type = await prisma.assetType.upsert({
          where: { name: "ครุภัณฑ์อื่นๆ" },
          update: {},
          create: { name: "ครุภัณฑ์อื่นๆ" },
          select: { id: true },
        });
        typeId = type.id;
      }

      let statusId: string | undefined;
      const statusName = assetStatusName || "ชำรุด";
      const status = await prisma.assetStatus.upsert({
        where: { name: String(statusName) },
        update: {},
        create: { name: String(statusName) },
        select: { id: true },
      });
      statusId = status.id;

      const createdAsset = await prisma.asset.create({
        data: {
          assetCode:
            assetCodeManual && String(assetCodeManual).length > 0
              ? String(assetCodeManual)
              : `TMP-${Date.now()}`,
          assetName: String(assetNameManual || "ครุภัณฑ์ไม่ทราบชื่อ"),
          typeId: typeId!,
          statusId: statusId!,
        },
        select: { id: true },
      });
      finalAssetId = createdAsset.id;
    }

    // Derive reporter details from user if reporterId provided
    let finalReporterName: string | null = null;
    let finalReporterEmail: string | null = null;
    if (reporterId) {
      const user = await prisma.user.findUnique({
        where: { id: String(reporterId) },
        select: { name: true, email: true },
      });
      if (user) {
        finalReporterName = user.name ?? null;
        finalReporterEmail = user.email ?? null;
      }
    }

    const created = await prisma.repairReport.create({
      data: {
        assetId: finalAssetId!,
        issueTitle: String(issueTitle),
        issueDescription: String(issueDescription),
        issueCategory: issueCategory ? String(issueCategory) : null,
        urgency:
          urgency && ["LOW", "MEDIUM", "HIGH"].includes(urgency)
            ? urgency
            : "MEDIUM",
        imageUrl: imageUrl ? String(imageUrl) : null,
        reporterId: reporterId ? String(reporterId) : null,
        reporterName: finalReporterName ?? "",
        reporterEmail: finalReporterEmail ?? "",
        reporterPhone: reporterPhone ? String(reporterPhone) : null,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e) {
    console.error("Create report error", e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
