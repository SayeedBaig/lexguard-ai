import { NextRequest, NextResponse } from "next/server";
import { orchestrateContractAnalysis } from "@/lib/agents";
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
        { error: "Please paste or upload contract text before analyzing." },
        { status: 400 },
      );
    }

    // Run the multi-agent orchestration pipeline:
    //   1. Risk Detector Agent  → risk scoring, clause extraction
    //   2. Legal Simplifier Agent → plain-English summaries, user actions
    const orchestratorResult = await orchestrateContractAnalysis(contractText);

    // Attach pipeline metadata to the analysis for observability
    const response = {
      ...orchestratorResult.analysis,
      _agentTrace: orchestratorResult.agentTrace,
      _runId: orchestratorResult.runId,
      _totalDurationMs: orchestratorResult.totalDurationMs,
    };

    return NextResponse.json(response);
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
      { status: isConfig ? 503 : isValidation ? 400 : 500 },
    );
  }
}
