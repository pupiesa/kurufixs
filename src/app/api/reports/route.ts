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

    const result = await prisma.$transaction(async (tx) => {
      // 1) เตรียมสถานะ "ชำรุด"
      const brokenStatus = await tx.assetStatus.upsert({
        where: { name: "ชำรุด" },
        update: {},
        create: { name: "ชำรุด" },
        select: { id: true },
      });

      // 2) เตรียม type (เฉพาะกรณี manual)
      let typeId: string | undefined = undefined;
      if (manualAsset) {
        const typeName =
          assetTypeName && String(assetTypeName).trim().length > 0
            ? String(assetTypeName)
            : "ครุภัณฑ์อื่นๆ";

        const type = await tx.assetType.upsert({
          where: { name: typeName },
          update: {},
          create: { name: typeName },
          select: { id: true },
        });
        typeId = type.id;
      }

      // 3) หา/สร้างผู้แจ้ง (ใช้เฉพาะข้อมูลประกอบ report)
      let finalReporterName: string | null = null;
      let finalReporterEmail: string | null = null;
      if (reporterId) {
        const user = await tx.user.findUnique({
          where: { id: String(reporterId) },
          select: { name: true, email: true },
        });
        if (user) {
          finalReporterName = user.name ?? null;
          finalReporterEmail = user.email ?? null;
        }
      }

      // 4) หา/สร้าง asset แล้ว "บังคับ" เปลี่ยนสถานะเป็นชำรุด
      let finalAssetId: string;

      if (!manualAsset) {
        if (!assetId) {
          throw new Error("กรุณาเลือกครุภัณฑ์หรือกรอกข้อมูล");
        }
        // ยืนยันว่ามี asset
        const existing = await tx.asset.findUnique({
          where: { id: String(assetId) },
          select: { id: true },
        });
        if (!existing) {
          throw new Error("Asset not found");
        }

        // อัปเดตสถานะเป็นชำรุด
        const updated = await tx.asset.update({
          where: { id: String(assetId) },
          data: { statusId: brokenStatus.id },
          select: { id: true },
        });
        finalAssetId = updated.id;
      } else {
        // กรณี manual: สร้าง asset ใหม่ พร้อมสถานะชำรุด
        const createdAsset = await tx.asset.create({
          data: {
            assetCode:
              assetCodeManual && String(assetCodeManual).trim().length > 0
                ? String(assetCodeManual)
                : `TMP-${Date.now()}`,
            assetName: String(assetNameManual || "ครุภัณฑ์ไม่ทราบชื่อ"),
            typeId: typeId!, // มาจากขั้นตอน 2
            statusId: brokenStatus.id, // บังคับเป็นชำรุด
          },
          select: { id: true },
        });
        finalAssetId = createdAsset.id;
      }

      // 5) สร้างใบแจ้งซ่อม
      const createdReport = await tx.repairReport.create({
        data: {
          assetId: finalAssetId,
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

      return createdReport.id;
    });

    return NextResponse.json({ ok: true, id: result }, { status: 201 });
  } catch (e: any) {
    const msg =
      typeof e?.message === "string" && e.message.includes("กรุณาเลือกครุภัณฑ์")
        ? e.message
        : typeof e?.message === "string" &&
          e.message.includes("Asset not found")
        ? e.message
        : "Server error";

    console.error("Create report error", e);
    return NextResponse.json(
      { message: msg },
      { status: msg === "Server error" ? 500 : 400 }
    );
  }
}
