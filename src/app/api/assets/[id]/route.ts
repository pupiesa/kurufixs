import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params; // Get the ID from the URL parameter

  try {
    await prisma.asset.delete({
      where: {
        id: String(id), // Ensure ID is a string if your model expects it
      },
    });
    return NextResponse.json(
      { message: "Asset deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting Asset:", error);
    return NextResponse.json(
      { error: "Failed to delete Asset" },
      { status: 500 }
    );
  }
}
