import { NextRequest, NextResponse } from "next/server";
import { verifyRequestAuth } from "@/lib/apiAuth";
import { runContractQAAgent } from "@/lib/agents/contractQAAgent";
import type { ChatMessage } from "@/lib/agents/contractQAAgent";
import { randomUUID } from "crypto";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const contractText = typeof body.contractText === "string" ? body.contractText.trim() : "";
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];
    const documentType = typeof body.documentType === "string" ? body.documentType : undefined;

    if (!contractText) {
      return NextResponse.json(
        { error: "Contract text is required." },
        { status: 400 },
      );
    }

    if (!question) {
      return NextResponse.json(
        { error: "Question cannot be empty." },
        { status: 400 },
      );
    }

    if (question.length > 1000) {
      return NextResponse.json(
        { error: "Question is too long. Please keep it under 1000 characters." },
        { status: 400 },
      );
    }

    const runId = randomUUID();
    const result = await runContractQAAgent(
      { contractText, question, history, documentType },
      runId,
    );

    return NextResponse.json({
      answer: result.answer,
      citations: result.citations,
      grounded: result.grounded,
      runId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Q&A failed. Please try again.";
    const isConfig = message.includes("GEMINI_API_KEY");
    return NextResponse.json(
      { error: message },
      { status: isConfig ? 503 : 500 },
    );
  }
}
