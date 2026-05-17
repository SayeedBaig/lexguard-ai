import { ApiError, GoogleGenAI } from "@google/genai";
import type { GeminiAnalysisPayload } from "./types";
import { mapGeminiToAnalysisResult } from "./mapGeminiResponse";
import type { AnalysisResult } from "./types";
import { contractAnalysisJsonSchema } from "./geminiSchema";

const MAX_CONTRACT_CHARS = 80_000;

/** Default model for Google AI Studio (Gemini API). Override with GEMINI_MODEL. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** Fallback if the primary model is unavailable for this API key/region. */
const FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash-lite"] as const;

const SYSTEM_PROMPT = `You are LexGuard, an expert legal contract analyst for a legal-tech SaaS product.
Analyze the contract text and identify risks, obligations, liabilities, and data privacy issues.
Be practical and clear — this is for business users, not lawyers only.
First, detect the document type (e.g. Employment Agreement, Privacy Policy, Vendor Agreement, Subscription Terms, Freelance Contract, Rental Agreement, Master Services Agreement, NDA, Terms of Service) and set documentTypeConfidence (0-100).
riskScores counts should reflect the number of flagged items at each severity (integers).
Provide 3-8 risky clauses when material issues exist, otherwise fewer.
For each risky clause include a concise plain-English explanation (1-2 sentences) of why it matters.
Always include actionable recommendations for the user signing or negotiating the contract.
This is not legal advice — analysis assists review only.

CRITICAL INSTRUCTIONS FOR CONSISTENCY:
- 'high' severity: severe financial liability, unlimited indemnification, loss of IP, or immediate termination without cause.
- 'medium' severity: non-standard auto-renewals, short notice periods, or ambiguous data usage rights.
- 'low' severity: standard boilerplate clauses that are slightly unfavorable but customary.
overallRisk MUST be 'high' if there is >= 1 high severity clause, 'medium' if >= 1 medium but no high, and 'low' otherwise.`;

function getModelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const candidates = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  return [...new Set(candidates)];
}

function isModelNotFoundError(error: unknown): boolean {
  if (error instanceof ApiError) {
    const msg = error.message.toLowerCase();
    return (
      error.status === 404 ||
      msg.includes("not found") ||
      msg.includes("is not supported")
    );
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("not found") || msg.includes("is not supported");
  }
  return false;
}

function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message || `Gemini API error (${error.status})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Analysis failed. Please try again.";
}

async function generateAnalysis(
  ai: GoogleGenAI,
  model: string,
  contractText: string,
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze this contract and return structured JSON:\n\n---\n${contractText}\n---`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: contractAnalysisJsonSchema,
      temperature: 0.0,
      topK: 1,
      topP: 0.1,
    },
  });

  const text = response.text;
  if (!text?.trim()) {
    throw new Error("Gemini returned an empty response. Please try again.");
  }
  return text;
}

export async function analyzeContractWithGemini(
  contractText: string,
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to .env.local and restart the dev server.",
    );
  }

  const trimmed = contractText.trim();
  if (!trimmed) {
    throw new Error("Contract text is empty.");
  }

  if (trimmed.length > MAX_CONTRACT_CHARS) {
    throw new Error(
      `Contract is too long (${trimmed.length} characters). Maximum is ${MAX_CONTRACT_CHARS}.`,
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const models = getModelCandidates();
  let lastError: unknown;

  for (const model of models) {
    try {
      const raw = await generateAnalysis(ai, model, trimmed);
      let payload: GeminiAnalysisPayload;
      try {
        payload = JSON.parse(raw) as GeminiAnalysisPayload;
      } catch {
        throw new Error("Failed to parse AI response. Please try again.");
      }
      return mapGeminiToAnalysisResult(payload, trimmed);
    } catch (error) {
      lastError = error;
      if (isModelNotFoundError(error)) {
        continue;
      }
      throw new Error(formatApiError(error));
    }
  }

  throw new Error(
    `No supported Gemini model available. Tried: ${models.join(", ")}. ${formatApiError(lastError)}`,
  );
}
