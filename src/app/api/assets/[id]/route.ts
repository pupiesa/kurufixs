import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // `params` can be a Promise in some Next.js types; await to get the actual params
  const { id } = await params;

  try {
    await prisma.asset.delete({
      where: {
        id: String(id), // Ensure ID is a string if your model expects it
      },
    });
    return NextResponse.json(
      { message: "Asset deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting Asset:", error);
    return NextResponse.json(
      { error: "Failed to delete Asset" },
      { status: 500 },
    );
  }
}
