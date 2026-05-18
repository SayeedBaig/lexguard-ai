import { NextRequest, NextResponse } from "next/server";
import { verifyRequestAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyRequestAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ownership before deleting
    const analysis = await prisma.contractAnalysis.findUnique({
      where: { id },
    });

    if (!analysis || analysis.userId !== dbUser.id) {
      return NextResponse.json({ error: "Analysis not found or forbidden" }, { status: 403 });
    }

    await prisma.contractAnalysis.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete history:", error);
    return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
  }
}
