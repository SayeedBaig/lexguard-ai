/**
 * LexGuard — Negotiation Recommender Agent
 *
 * Responsibilities:
 *  - Consume identified risks from Risk Detector Agent
 *  - Consume plain-English simplifications from Legal Simplifier Agent
 *  - Generate clause-level negotiation recommendations
 *  - Suggest safer alternative clause wording
 *  - Provide business impact reasoning for each risk
 *  - Produce an overall negotiation strategy summary
 *
 * Does NOT re-score risk — that is the Risk Detector's job.
 * Focuses purely on: what to negotiate, how to negotiate it, and why.
 */

import { ApiError, GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

import type {
  AgentContext,
  AgentResult,
  NegotiationRecommenderInput,
  NegotiationRecommenderOutput,
  NegotiationRecommendation,
} from "./types";
import { createAgentLogger } from "./logger";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_NAME = "NegotiationRecommenderAgent";
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

const PrioritySchema = z.enum(["critical", "high", "medium", "low"]).catch("medium");

const NegotiationRecommendationSchema = z.object({
  clauseId: z.string().catch(""),
  clauseTitle: z.string().catch("Clause"),
  issue: z.string().catch("This clause requires review."),
  recommendation: z.string().catch("Negotiate more favorable terms."),
  businessImpact: z.string().catch("May affect business operations."),
  alternativeWording: z.string().optional(),
  priority: PrioritySchema,
  negotiable: z.boolean().catch(true),
});

const NegotiationRecommenderResponseSchema = z.object({
  negotiationStrategy: z
    .string()
    .catch("Review and negotiate the flagged clauses before signing."),
  recommendations: z.array(NegotiationRecommendationSchema).catch([]),
  overallLeverage: z
    .enum(["strong", "moderate", "weak"])
    .catch("moderate"),
  priorityFocus: z.string().catch("Focus on the highest-risk clauses first."),
  walkAwayTriggers: z.array(z.string()).catch([]),
  quickWins: z.array(z.string()).catch([]),
});

// ---------------------------------------------------------------------------
// Gemini JSON Schema (structured output enforcement)
// ---------------------------------------------------------------------------

const NEGOTIATION_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    negotiationStrategy: {
      type: Type.STRING,
      description:
        "2-3 paragraph overall negotiation strategy for this specific contract. Include the user's leverage position, key priorities, and recommended approach.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clauseId: {
            type: Type.STRING,
            description: "The ID of the risky clause this recommendation addresses",
          },
          clauseTitle: {
            type: Type.STRING,
            description: "The title of the clause being addressed",
          },
          issue: {
            type: Type.STRING,
            description:
              "Clear statement of what is problematic about this clause. 1-2 sentences.",
          },
          recommendation: {
            type: Type.STRING,
            description:
              "Specific negotiation recommendation. What exactly should the user request or propose? 2-3 sentences.",
          },
          businessImpact: {
            type: Type.STRING,
            description:
              "The practical business and financial impact if this clause is NOT negotiated. 1-2 sentences.",
          },
          alternativeWording: {
            type: Type.STRING,
            description:
              "Optional: suggested alternative contract wording that would be more favorable. Use legal-sounding but plain language. If no improvement is possible, omit this field.",
          },
          priority: {
            type: Type.STRING,
            enum: ["critical", "high", "medium", "low"],
            description: "How urgently this clause should be negotiated",
          },
          negotiable: {
            type: Type.BOOLEAN,
            description:
              "Whether this clause is typically negotiable in practice (some boilerplate clauses are non-negotiable)",
          },
        },
        required: [
          "clauseId",
          "clauseTitle",
          "issue",
          "recommendation",
          "businessImpact",
          "priority",
          "negotiable",
        ],
      },
    },
    overallLeverage: {
      type: Type.STRING,
      enum: ["strong", "moderate", "weak"],
      description:
        "The user's overall negotiation leverage given the contract type and risk profile. 'strong' = user has real power to negotiate, 'moderate' = some room, 'weak' = mostly take-it-or-leave-it.",
    },
    priorityFocus: {
      type: Type.STRING,
      description:
        "A single clear sentence telling the user where to focus their negotiation energy first.",
    },
    walkAwayTriggers: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "2-4 specific conditions where the user should consider walking away from this contract entirely if the other party refuses to negotiate.",
    },
    quickWins: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "2-4 easy asks that are commonly accepted in negotiation and would significantly improve the contract with minimal friction.",
    },
  },
  required: [
    "negotiationStrategy",
    "recommendations",
    "overallLeverage",
    "priorityFocus",
    "walkAwayTriggers",
    "quickWins",
  ],
};

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the LexGuard Negotiation Recommender — a specialized AI agent that generates practical, actionable negotiation guidance for contract review.

Your sole responsibility is negotiation strategy and clause improvement recommendations. You do NOT re-assess risk scores — those have already been computed.

CORE PRINCIPLES:
- Be specific, not generic. "Request a liability cap equal to the contract value" is better than "negotiate liability terms."
- Focus on what is actually negotiable in practice. Not all clauses can be changed.
- Provide concrete alternative wording where it would meaningfully help.
- Consider the document type — negotiation leverage varies significantly by contract type.
- Employment agreements favor employers, SaaS agreements have standard terms, custom MSAs are highly negotiable.

NEGOTIATION STRATEGY GUIDELINES:
- Assess the user's leverage based on contract type and risk profile
- Prioritize: critical > high > medium severity issues
- Suggest realistic asks, not wishful thinking
- Identify "quick wins" — easy changes that are commonly accepted
- Flag walk-away conditions for truly unacceptable clauses

ALTERNATIVE WORDING GUIDELINES:
- Only provide where genuinely helpful and legally reasonable
- Keep it plain but professional
- Show BEFORE and AFTER only if space allows
- Focus on balanced, mutual language

TONE:
- Practical and business-focused
- Direct — no fluff
- Empowering — the user should feel capable of negotiating after reading this`;

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
// Build User Prompt
// ---------------------------------------------------------------------------

function buildUserPrompt(input: NegotiationRecommenderInput): string {
  const clauseList = input.riskyClauses
    .map(
      (c) =>
        `ID: ${c.id}
Title: "${c.title}"
Severity: ${c.severity}
Category: ${c.category}
Excerpt: "${c.excerpt.slice(0, 300)}"
Risk: ${c.explanation}
${
  input.simplifiedClauses?.[c.id]
    ? `Plain-English: ${input.simplifiedClauses[c.id].plainExplanation}
User Action: ${input.simplifiedClauses[c.id].actionAdvice}`
    : ""
}`,
    )
    .join("\n\n---\n\n");

  return `Generate negotiation recommendations for the following contract analysis.

DOCUMENT TYPE: ${input.documentType}
OVERALL RISK: ${input.overallRisk}
RISK SCORE: ${input.riskScore}/100
RISK CATEGORIES: ${input.riskCategories.join(", ")}

RISKY CLAUSES TO ADDRESS (${input.riskyClauses.length} total):
${clauseList || "No specific clauses flagged."}

KEY ACTIONS ALREADY IDENTIFIED:
${input.keyActions?.map((a, i) => `${i + 1}. ${a}`).join("\n") || "None"}

Provide a complete negotiation strategy with:
1. Overall negotiation approach for this specific contract
2. Per-clause recommendations (covering all clauses listed above)
3. Alternative wording where helpful
4. Quick wins and walk-away triggers

Return structured JSON.`;
}

// ---------------------------------------------------------------------------
// Core Gemini Call
// ---------------------------------------------------------------------------

async function callGemini(
  ai: GoogleGenAI,
  model: string,
  input: NegotiationRecommenderInput,
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: buildUserPrompt(input),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: NEGOTIATION_JSON_SCHEMA,
      temperature: 0.15,
      topK: 10,
      topP: 0.85,
    },
  });

  const text = response.text;
  if (!text?.trim()) {
    throw new Error("Negotiation Recommender: Gemini returned an empty response.");
  }
  return text;
}

// ---------------------------------------------------------------------------
// Negotiation Recommender Agent — Main Entry Point
// ---------------------------------------------------------------------------

export async function runNegotiationRecommenderAgent(
  input: NegotiationRecommenderInput,
  ctx: AgentContext,
): Promise<AgentResult<NegotiationRecommenderOutput>> {
  const logger = createAgentLogger(AGENT_NAME, ctx.runId);
  const startTime = Date.now();

  logger.start({
    documentType: input.documentType,
    overallRisk: input.overallRisk,
    clauseCount: input.riskyClauses.length,
  });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

    // If no clauses, return graceful minimal output
    if (input.riskyClauses.length === 0) {
      logger.warn("No risky clauses — returning minimal negotiation output");
      const durationMs = Date.now() - startTime;
      return {
        agentName: AGENT_NAME,
        success: true,
        data: {
          negotiationStrategy:
            "No significant risks were identified. Review the contract for completeness and ensure all agreed terms are accurately reflected before signing.",
          recommendations: [],
          overallLeverage: "moderate",
          priorityFocus: "No critical negotiation points identified.",
          walkAwayTriggers: [],
          quickWins: ["Confirm all verbal agreements are captured in writing."],
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
              throw new Error(
                "Negotiation Recommender: Failed to parse AI response — malformed JSON.",
              );
            }
          }

          const validated = NegotiationRecommenderResponseSchema.parse(payload);

          const output: NegotiationRecommenderOutput = {
            negotiationStrategy: validated.negotiationStrategy,
            recommendations: validated.recommendations as NegotiationRecommendation[],
            overallLeverage: validated.overallLeverage,
            priorityFocus: validated.priorityFocus,
            walkAwayTriggers: validated.walkAwayTriggers,
            quickWins: validated.quickWins,
          };

          const durationMs = Date.now() - startTime;
          logger.complete(durationMs, {
            model,
            recommendationCount: output.recommendations.length,
            overallLeverage: output.overallLeverage,
            quickWinCount: output.quickWins.length,
          });

          return { agentName: AGENT_NAME, success: true, data: output, durationMs };
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
      `No supported Gemini model available. Tried: ${getModelCandidates().join(", ")}. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.fail(durationMs, error);

    // Non-fatal — provide graceful fallback based on existing risk data
    return {
      agentName: AGENT_NAME,
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Negotiation Recommender failed unexpectedly.",
      durationMs,
      data: {
        negotiationStrategy:
          "AI negotiation guidance is temporarily unavailable. Review the risky clauses identified above and consider consulting a lawyer for negotiation strategy.",
        recommendations: input.riskyClauses.map((c) => ({
          clauseId: c.id,
          clauseTitle: c.title,
          issue: c.explanation,
          recommendation: `Negotiate more favorable terms for the "${c.title}" clause. Consider requesting mutual obligations or adding protective caps.`,
          businessImpact: `This ${c.severity}-severity clause may create significant obligations or exposure if left unchanged.`,
          alternativeWording: undefined,
          priority: c.severity,
          negotiable: true,
        })),
        overallLeverage: "moderate",
        priorityFocus: `Focus negotiation on the ${input.riskyClauses.filter((c) => c.severity === "critical" || c.severity === "high").length} high-priority clauses first.`,
        walkAwayTriggers: [],
        quickWins: [],
      },
    };
  }
}
