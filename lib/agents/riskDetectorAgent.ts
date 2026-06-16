/**
 * LexGuard — Risk Detector Agent
 *
 * Responsibilities:
 *  - Detect document type
 *  - Risk scoring (0-100)
 *  - Severity analysis (low / medium / high / critical)
 *  - Risky clause extraction & categorization
 *  - Obligations, liabilities, privacy concerns, recommendations, findings
 *
 * This is a direct refactor of the existing gemini.ts + riskEngine.ts logic
 * into its own isolated, testable agent module.
 */

import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { Type } from "@google/genai";

import type { AgentContext, AgentResult, RiskDetectorInput, RiskDetectorOutput } from "./types";
import { createAgentLogger } from "./logger";
import { mapGeminiToAnalysisResult } from "../mapGeminiResponse";
import { normalizeAnalysisResult } from "../riskEngine";
import type { GeminiAnalysisPayload } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_NAME = "RiskDetectorAgent";
export const DEFAULT_MODEL = "gemini-2.5-flash";
const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
] as const;
const MAX_CONTRACT_CHARS = 80_000;
const MAX_RETRIES = 2;

// ---------------------------------------------------------------------------
// Zod Validation Schema
// ---------------------------------------------------------------------------

const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);

const RiskDetectorResponseSchema = z.object({
  overallRisk: RiskLevelSchema.catch("medium"),
  documentType: z.string().catch("Unknown Document"),
  documentTypeConfidence: z.number().catch(50),
  riskScores: z
    .object({
      low: z.number().catch(0),
      medium: z.number().catch(0),
      high: z.number().catch(0),
      critical: z.number().catch(0),
    })
    .catch({ low: 0, medium: 0, high: 0, critical: 0 }),
  plainEnglish: z.string().catch("Analysis unavailable."),
  riskyClauses: z
    .array(
      z.object({
        title: z.string().catch("Flagged clause"),
        excerpt: z.string().catch(""),
        explanation: z.string().catch("Needs review"),
        severity: RiskLevelSchema.catch("medium"),
        category: z.string().catch("General"),
        lineRef: z.string().optional(),
      }),
    )
    .catch([]),
  obligations: z
    .array(z.object({ text: z.string(), party: z.string().optional() }))
    .catch([]),
  liabilities: z
    .array(z.object({ text: z.string(), party: z.string().optional() }))
    .catch([]),
  privacyConcerns: z
    .array(
      z.object({
        title: z.string().catch("Privacy Concern"),
        description: z.string().catch("Review for privacy risks"),
        severity: RiskLevelSchema.catch("medium"),
      }),
    )
    .catch([]),
  recommendations: z
    .array(
      z.object({
        title: z.string().catch("Recommendation"),
        description: z.string().catch("Review contract"),
        priority: RiskLevelSchema.catch("medium"),
      }),
    )
    .catch([]),
  findings: z
    .array(
      z.object({
        title: z.string().catch("Finding"),
        description: z.string().catch(""),
        confidence: z.number().catch(50),
        tag: z.string().catch("General"),
        severity: RiskLevelSchema.catch("medium"),
      }),
    )
    .catch([]),
  riskScore: z.number().catch(50),
  confidence: z.number().catch(50),
  riskCategories: z.array(z.string()).catch(["General"]),
});

// ---------------------------------------------------------------------------
// Gemini JSON Schema (for structured output enforcement)
// ---------------------------------------------------------------------------

const riskLevelEnumSchema = {
  type: Type.STRING,
  enum: ["low", "medium", "high", "critical"],
};

const RISK_DETECTOR_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallRisk: { ...riskLevelEnumSchema, description: "Overall contract risk level" },
    documentType: {
      type: Type.STRING,
      description:
        "Detected document category. Prefer: Employment Agreement, Privacy Policy, Vendor Agreement, Subscription Terms, Freelance Contract, Rental Agreement, Master Services Agreement, Non-Disclosure Agreement, Terms of Service, Lease Agreement, Partnership Agreement, or Other.",
    },
    documentTypeConfidence: {
      type: Type.NUMBER,
      description: "Confidence 0-100 that documentType is correct",
    },
    riskScores: {
      type: Type.OBJECT,
      properties: {
        low: { type: Type.NUMBER },
        medium: { type: Type.NUMBER },
        high: { type: Type.NUMBER },
        critical: { type: Type.NUMBER },
      },
      required: ["low", "medium", "high", "critical"],
    },
    plainEnglish: {
      type: Type.STRING,
      description: "2-4 paragraph plain-English summary for a non-lawyer",
    },
    riskyClauses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          explanation: {
            type: Type.STRING,
            description: "1-2 sentence plain-English explanation of why this clause is risky",
          },
          severity: riskLevelEnumSchema,
          category: { type: Type.STRING },
          lineRef: { type: Type.STRING },
        },
        required: ["title", "excerpt", "explanation", "severity", "category"],
      },
    },
    obligations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { text: { type: Type.STRING }, party: { type: Type.STRING } },
        required: ["text"],
      },
    },
    liabilities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { text: { type: Type.STRING }, party: { type: Type.STRING } },
        required: ["text"],
      },
    },
    privacyConcerns: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          severity: riskLevelEnumSchema,
        },
        required: ["title", "description", "severity"],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: riskLevelEnumSchema,
        },
        required: ["title", "description", "priority"],
      },
    },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          tag: { type: Type.STRING },
          severity: riskLevelEnumSchema,
        },
        required: ["title", "description", "confidence", "tag", "severity"],
      },
    },
    riskScore: { type: Type.NUMBER, description: "Overall risk score 0-100" },
    confidence: { type: Type.NUMBER, description: "Analysis confidence 0-100" },
    riskCategories: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Main areas of risk identified",
    },
  },
  required: [
    "overallRisk",
    "documentType",
    "documentTypeConfidence",
    "riskScores",
    "plainEnglish",
    "riskyClauses",
    "obligations",
    "liabilities",
    "privacyConcerns",
    "recommendations",
    "findings",
    "riskScore",
    "confidence",
    "riskCategories",
  ],
};

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the LexGuard Risk Detector — a specialized AI agent for legal contract risk analysis within a legal-tech SaaS product.

Your sole responsibility is to identify, categorize, and score risks in a contract.

SEVERITY RULES (apply strictly and consistently):
- 'critical': illegal clauses, extreme liability without cap, or blatant violations of privacy laws.
- 'high': severe financial liability, unlimited indemnification, loss of IP, or immediate termination without cause.
- 'medium': non-standard auto-renewals, short notice periods, or ambiguous data usage rights.
- 'low': standard boilerplate clauses that are slightly unfavorable but customary.

OVERALL RISK DETERMINATION:
- overallRisk MUST be 'critical' if >= 1 critical clause exists
- 'high' if >= 1 high clause (and no critical)
- 'medium' if >= 1 medium clause (and no higher)
- 'low' only if all clauses are low severity

OUTPUT RULES:
- First, detect the document type and set documentTypeConfidence (0-100)
- riskScores must reflect counts of flagged items at each severity level (integers)
- Provide 3-8 risky clauses when material issues exist
- For each risky clause, include a concise 1-2 sentence plain-English explanation of why it matters
- Always provide actionable recommendations
- Also provide overall riskScore (0-100), confidence (0-100), and riskCategories array (e.g. "Liability", "Data Privacy", "Auto-Renewal")
- This is not legal advice — analysis assists review only.`;

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
// Core Gemini Call
// ---------------------------------------------------------------------------

async function callGemini(
  ai: GoogleGenAI,
  model: string,
  contractText: string,
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze this contract for risks and return structured JSON:\n\n---\n${contractText}\n---`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: RISK_DETECTOR_JSON_SCHEMA,
      temperature: 0.0,
      topK: 1,
      topP: 0.1,
    },
  });

  const text = response.text;
  if (!text?.trim()) {
    throw new Error("Risk Detector: Gemini returned an empty response.");
  }
  return text;
}

// ---------------------------------------------------------------------------
// Risk Detector Agent — Main Entry Point
// ---------------------------------------------------------------------------

export async function runRiskDetectorAgent(
  input: RiskDetectorInput,
  ctx: AgentContext,
): Promise<AgentResult<RiskDetectorOutput>> {
  const logger = createAgentLogger(AGENT_NAME, ctx.runId);
  const startTime = Date.now();

  logger.start({
    contractLength: input.contractText.length,
    contractWords: input.contractText.trim().split(/\s+/).length,
  });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const trimmed = input.contractText.trim();
    if (!trimmed) throw new Error("Contract text is empty.");
    if (trimmed.length > MAX_CONTRACT_CHARS) {
      throw new Error(
        `Contract is too long (${trimmed.length} chars). Maximum is ${MAX_CONTRACT_CHARS}.`,
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const models = getModelCandidates();
    let lastError: unknown;

    for (const model of models) {
      logger.debug(`Trying model: ${model}`);
      let attempt = 0;

      while (attempt <= MAX_RETRIES) {
        try {
          const raw = await callGemini(ai, model, trimmed);

          let payload: unknown;
          try {
            payload = JSON.parse(raw);
          } catch {
            const fallbackRaw = extractJsonFallback(raw);
            try {
              payload = JSON.parse(fallbackRaw);
            } catch {
              throw new Error("Risk Detector: Failed to parse AI response — malformed JSON.");
            }
          }

          const validated = RiskDetectorResponseSchema.parse(payload) as GeminiAnalysisPayload;

          // Reuse existing mapping + normalization logic
          const mapped = mapGeminiToAnalysisResult(validated, trimmed);
          const normalized = normalizeAnalysisResult(mapped);

          const output: RiskDetectorOutput = {
            overallRisk: normalized.overallRisk,
            riskScore: normalized.riskScore,
            confidence: normalized.confidence,
            riskCategories: normalized.riskCategories,
            documentType: normalized.documentType,
            documentTypeConfidence: normalized.documentTypeConfidence,
            riskScores: normalized.riskScores,
            riskyClauses: normalized.riskyClauses,
            obligations: normalized.obligations,
            liabilities: (validated as GeminiAnalysisPayload).liabilities ?? [],
            privacyConcerns: normalized.privacyConcerns,
            recommendations: normalized.recommendations,
            findings: normalized.findings,
            rawSummary: normalized.plainEnglish,
            wordCount: normalized.wordCount,
          };

          const durationMs = Date.now() - startTime;
          logger.complete(durationMs, {
            model,
            overallRisk: output.overallRisk,
            riskScore: output.riskScore,
            clauseCount: output.riskyClauses.length,
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
    return {
      agentName: AGENT_NAME,
      success: false,
      error: error instanceof Error ? error.message : "Risk Detector failed unexpectedly.",
      durationMs,
    };
  }
}
