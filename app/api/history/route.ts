import { NextRequest, NextResponse } from "next/server";
import { verifyRequestAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequestAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid },
    });

    if (!dbUser) {
      return NextResponse.json([]);
    }

    const history = await prisma.contractAnalysis.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      history.map((h) => ({
        id: h.id,
        contractText: h.contractText,
        fileName: h.fileName,
        result: h.result,
        timestamp: h.createdAt.toISOString(),
        riskScore: h.riskScore,
        severity: h.severity,
        confidence: h.confidence,
        riskCategories: h.riskCategories,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractText, fileName, result } = body;

    const severity = result.overallRisk;
    const confidence = result.confidence || 0;
    const riskCategories = result.riskCategories || [];
    const riskScore = result.riskScore || 0;

    // Upsert the user to ensure they exist in PostgreSQL
    const dbUser = await prisma.user.upsert({
      where: { firebaseUid: user.uid },
      update: {},
      create: {
        firebaseUid: user.uid,
        email: user.email || null,
      },
    });

    const newAnalysis = await prisma.contractAnalysis.create({
      data: {
        userId: dbUser.id,
        contractText,
        fileName,
        result: result as any,
        riskScore,
        severity,
        confidence,
        riskCategories,
      },
    });

    return NextResponse.json({
      id: newAnalysis.id,
      contractText: newAnalysis.contractText,
      fileName: newAnalysis.fileName,
      result: newAnalysis.result,
      timestamp: newAnalysis.createdAt.toISOString(),
      riskScore: newAnalysis.riskScore,
      severity: newAnalysis.severity,
      confidence: newAnalysis.confidence,
      riskCategories: newAnalysis.riskCategories,
    });
  } catch (error) {
    console.error("Failed to save history:", error);
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
  }
}
