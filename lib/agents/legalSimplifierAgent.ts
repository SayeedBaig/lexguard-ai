/**
 * LexGuard — Legal Simplifier Agent
 *
 * Responsibilities:
 *  - Convert legal clauses into plain English
 *  - Generate user-friendly explanations and action advice
 *  - Summarize complex legal language into a polished executive summary
 *  - Produce a one-sentence TLDR and a list of key user actions
 *
 * Runs AFTER the Risk Detector Agent — receives its structured output as input.
 * Uses a dedicated Gemini prompt focused on clarity and user-friendliness,
 * not risk scoring (separation of concerns).
 */

import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { Type } from "@google/genai";

import type {
  AgentContext,
  AgentResult,
  LegalSimplifierInput,
  LegalSimplifierOutput,
  SimplifiedClause,
} from "./types";
import { createAgentLogger } from "./logger";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_NAME = "LegalSimplifierAgent";
const DEFAULT_MODEL = "gemini-2.5-flash";
const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
] as const;
const MAX_RETRIES = 2;

// ---------------------------------------------------------------------------
// Zod Validation Schema
// ---------------------------------------------------------------------------

const SimplifiedClauseSchema = z.object({
  clauseId: z.string().catch("unknown"),
  friendlyTitle: z.string().catch("Clause"),
  plainExplanation: z.string().catch("This clause requires review."),
  actionAdvice: z.string().catch("Discuss with your lawyer."),
  severityLabel: z.string().catch("Review"),
});

const LegalSimplifierResponseSchema = z.object({
  executiveSummary: z
    .string()
    .catch(
      "This contract has been analyzed. Review the flagged clauses carefully before signing.",
    ),
  simplifiedClauses: z.array(SimplifiedClauseSchema).catch([]),
  tldr: z
    .string()
    .catch("This contract contains provisions that require careful review before signing."),
  keyActions: z.array(z.string()).catch(["Review all flagged clauses", "Consult a lawyer if uncertain"]),
});

// ---------------------------------------------------------------------------
// Gemini JSON Schema (structured output enforcement)
// ---------------------------------------------------------------------------

const LEGAL_SIMPLIFIER_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description:
        "A polished 2-4 paragraph plain-English executive summary written for a non-lawyer. Should be friendly, clear, and actionable.",
    },
    simplifiedClauses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clauseId: {
            type: Type.STRING,
            description: "The id of the risky clause this simplification corresponds to",
          },
          friendlyTitle: {
            type: Type.STRING,
            description: "A plain-language, user-friendly title for the clause",
          },
          plainExplanation: {
            type: Type.STRING,
            description:
              "A clear, jargon-free explanation of what this clause actually means for the user in practical terms. 2-3 sentences.",
          },
          actionAdvice: {
            type: Type.STRING,
            description:
              "Specific, actionable advice on what the user should do about this clause. 1-2 sentences.",
          },
          severityLabel: {
            type: Type.STRING,
            description:
              "A user-friendly severity label. Use: 'Watch Out', 'Important', 'Minor Concern', or 'Critical Risk'.",
          },
        },
        required: [
          "clauseId",
          "friendlyTitle",
          "plainExplanation",
          "actionAdvice",
          "severityLabel",
        ],
      },
    },
    tldr: {
      type: Type.STRING,
      description:
        "A single sentence summarizing the most important thing about this contract for the user.",
    },
    keyActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "3-5 specific actions the user should take before signing or after reviewing this contract. Each item should be a clear, actionable instruction.",
    },
  },
  required: ["executiveSummary", "simplifiedClauses", "tldr", "keyActions"],
};

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the LexGuard Legal Simplifier — a specialized AI agent that translates complex legal contract language into clear, friendly explanations for everyday users.

Your sole responsibility is making legal content understandable and actionable — you do NOT re-score risk (that has already been done).

TONE GUIDELINES:
- Write for a smart non-lawyer — no legal jargon
- Be direct, empathetic, and practical
- Avoid alarming language unnecessarily, but be honest about real risks
- Use simple, conversational English

EXECUTIVE SUMMARY GUIDELINES:
- 2-4 paragraphs
- Cover: what this contract is, the key risks identified, the overall situation, and what the user should do
- Calibrate tone to the risk level: critical = urgent, high = serious concern, medium = careful review needed, low = generally favorable

SIMPLIFIED CLAUSE GUIDELINES:
- For each clause provided, write a plain-English explanation of what it actually means for the user day-to-day
- Focus on impact: "This means you could lose...", "This means the company can..."
- Give specific, actionable advice — not generic "consult a lawyer"
- Use friendly severity labels: 'Critical Risk', 'Watch Out', 'Important', 'Minor Concern'

TLDR GUIDELINES:
- One punchy sentence capturing the most important thing the user needs to know

KEY ACTIONS GUIDELINES:
- 3-5 specific, ordered actions the user should take
- Start each with an action verb: "Request...", "Negotiate...", "Add...", "Review...", "Ask..."`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractJsonFallback(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

function getModelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const candidates = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  return [...new Set(candidates)];
}

function shouldFallbackModel(error: unknown): boolean {
  if (error instanceof ApiError) {
    return (
      error.status === 404 ||
      error.status === 503 ||
      error.status === 429 ||
      error.message.toLowerCase().includes("not found") ||
      error.message.toLowerCase().includes("is not supported") ||
      error.message.toLowerCase().includes("overloaded") ||
      error.message.toLowerCase().includes("high demand")
    );
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("not found") ||
      msg.includes("is not supported") ||
      msg.includes("503") ||
      msg.includes("429") ||
      msg.includes("overloaded") ||
      msg.includes("high demand")
    );
  }
  return false;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return (
      error.status === 503 ||
      error.status === 429 ||
      error.message.toLowerCase().includes("overloaded") ||
      error.message.toLowerCase().includes("high demand")
    );
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("503") ||
      msg.includes("429") ||
      msg.includes("overloaded") ||
      msg.includes("high demand")
    );
  }
  return false;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Build User Prompt from Input
// ---------------------------------------------------------------------------

function buildUserPrompt(input: LegalSimplifierInput): string {
  const clausesSummary = input.riskyClauses
    .map(
      (c) =>
        `- ID: ${c.id} | Title: "${c.title}" | Severity: ${c.severity} | Category: ${c.category}\n  Excerpt: "${c.excerpt.slice(0, 200)}..."\n  Risk explanation: ${c.explanation}`,
    )
    .join("\n\n");

  return `Please simplify the following legal contract analysis for a non-lawyer user.

DOCUMENT TYPE: ${input.documentType}
OVERALL RISK LEVEL: ${input.overallRisk}

ORIGINAL SUMMARY (from risk analysis):
${input.rawSummary}

RISKY CLAUSES TO SIMPLIFY (${input.riskyClauses.length} clauses):
${clausesSummary || "No specific clauses flagged."}

Generate a user-friendly executive summary, simplified per-clause explanations (using the clause IDs provided), a one-sentence TLDR, and 3-5 key actions the user should take. Return structured JSON.`;
}

// ---------------------------------------------------------------------------
// Core Gemini Call
// ---------------------------------------------------------------------------

async function callGemini(
  ai: GoogleGenAI,
  model: string,
  input: LegalSimplifierInput,
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: buildUserPrompt(input),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: LEGAL_SIMPLIFIER_JSON_SCHEMA,
      temperature: 0.2, // Slightly higher for more natural language
      topK: 10,
      topP: 0.8,
    },
  });

  const text = response.text;
  if (!text?.trim()) {
    throw new Error("Legal Simplifier: Gemini returned an empty response.");
  }
  return text;
}

// ---------------------------------------------------------------------------
// Legal Simplifier Agent — Main Entry Point
// ---------------------------------------------------------------------------

export async function runLegalSimplifierAgent(
  input: LegalSimplifierInput,
  ctx: AgentContext,
): Promise<AgentResult<LegalSimplifierOutput>> {
  const logger = createAgentLogger(AGENT_NAME, ctx.runId);
  const startTime = Date.now();

  logger.start({
    documentType: input.documentType,
    overallRisk: input.overallRisk,
    clauseCount: input.riskyClauses.length,
  });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    // If no clauses, return a graceful minimal output without calling the API
    if (input.riskyClauses.length === 0 && !input.rawSummary.trim()) {
      logger.warn("No clauses or summary provided — returning minimal simplification");
      const durationMs = Date.now() - startTime;
      return {
        agentName: AGENT_NAME,
        success: true,
        data: {
          executiveSummary: "No significant risks were identified in this contract.",
          simplifiedClauses: [],
          tldr: "This contract appears to be relatively low risk.",
          keyActions: ["Read through the full contract before signing", "Keep a signed copy for your records"],
        },
        durationMs,
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const models = getModelCandidates();
    let lastError: unknown;

    for (const model of models) {
      logger.debug(`Trying model: ${model}`);
      let attempt = 0;

      while (attempt <= MAX_RETRIES) {
        try {
          const raw = await callGemini(ai, model, input);

          let payload: unknown;
          try {
            payload = JSON.parse(raw);
          } catch {
            const fallbackRaw = extractJsonFallback(raw);
            try {
              payload = JSON.parse(fallbackRaw);
            } catch {
              throw new Error("Legal Simplifier: Failed to parse AI response — malformed JSON.");
            }
          }

          const validated = LegalSimplifierResponseSchema.parse(payload);

          const output: LegalSimplifierOutput = {
            executiveSummary: validated.executiveSummary,
            simplifiedClauses: validated.simplifiedClauses as SimplifiedClause[],
            tldr: validated.tldr,
            keyActions: validated.keyActions,
          };

          const durationMs = Date.now() - startTime;
          logger.complete(durationMs, {
            model,
            simplifiedClauseCount: output.simplifiedClauses.length,
            keyActionCount: output.keyActions.length,
          });

          return {
            agentName: AGENT_NAME,
            success: true,
            data: output,
            durationMs,
          };
        } catch (error) {
          lastError = error;

          if (isRetryableError(error) && attempt < MAX_RETRIES) {
            attempt++;
            const waitMs = 1500 * attempt;
            logger.warn(`Retryable error — waiting ${waitMs}ms before retry ${attempt}`, {
              model,
              error: error instanceof Error ? error.message : String(error),
            });
            await delay(waitMs);
            continue;
          }

          if (shouldFallbackModel(error)) {
            logger.warn(`Model ${model} unavailable — trying next fallback`, {
              error: error instanceof Error ? error.message : String(error),
            });
            break;
          }

          throw error;
        }
      }
    }

    throw new Error(
      `No supported Gemini model available. Tried: ${models.join(", ")}. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.fail(durationMs, error);

    // Legal Simplifier failure is non-fatal — return graceful fallback
    return {
      agentName: AGENT_NAME,
      success: false,
      error: error instanceof Error ? error.message : "Legal Simplifier failed unexpectedly.",
      durationMs,
      // Provide degraded fallback so the orchestrator can still return a result
      data: {
        executiveSummary: input.rawSummary || "Summary unavailable.",
        simplifiedClauses: input.riskyClauses.map((c) => ({
          clauseId: c.id,
          friendlyTitle: c.title,
          plainExplanation: c.explanation,
          actionAdvice: "Review this clause carefully before signing.",
          severityLabel:
            c.severity === "critical"
              ? "Critical Risk"
              : c.severity === "high"
                ? "Watch Out"
                : c.severity === "medium"
                  ? "Important"
                  : "Minor Concern",
        })),
        tldr: "Review the flagged clauses carefully before signing this contract.",
        keyActions: ["Review all flagged clauses with a legal professional before signing."],
      },
    };
  }
}
