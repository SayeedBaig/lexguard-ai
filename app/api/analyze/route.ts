import { NextRequest, NextResponse } from "next/server";
import { analyzeContractWithGemini } from "@/lib/gemini";
import { verifyRequestAuth } from "@/lib/apiAuth";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const contractText =
      typeof body.contractText === "string" ? body.contractText : "";

    if (!contractText.trim()) {
      return NextResponse.json(
        {
          error:
            "Please paste or upload contract text before analyzing.",
        },
        { status: 400 },
      );
    }

    const result = await analyzeContractWithGemini(contractText);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Analysis failed. Please try again.";

    const isConfig = message.includes("GEMINI_API_KEY");
    const isValidation =
      message.includes("empty") || message.includes("too long");

    return NextResponse.json(
      { error: message },
      {
        status: isConfig ? 503 : isValidation ? 400 : 500,
      },
    );
  }
}
