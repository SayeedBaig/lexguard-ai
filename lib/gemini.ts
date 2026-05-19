import { ApiError, GoogleGenAI } from "@google/genai";
import type { GeminiAnalysisPayload } from "./types";
import { mapGeminiToAnalysisResult } from "./mapGeminiResponse";
import type { AnalysisResult } from "./types";
import { contractAnalysisJsonSchema } from "./geminiSchema";
import { z } from "zod";

const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);

const GeminiResponseSchema = z.object({
  overallRisk: RiskLevelSchema.catch("medium"),
  documentType: z.string().catch("Unknown Document"),
  documentTypeConfidence: z.number().catch(50),
  riskScores: z.object({
    low: z.number().catch(0),
    medium: z.number().catch(0),
    high: z.number().catch(0),
    critical: z.number().catch(0),
  }).catch({ low: 0, medium: 0, high: 0, critical: 0 }),
  plainEnglish: z.string().catch("Analysis unavailable."),
  riskyClauses: z.array(z.object({
    title: z.string().catch("Flagged clause"),
    excerpt: z.string().catch(""),
    explanation: z.string().catch("Needs review"),
    severity: RiskLevelSchema.catch("medium"),
    category: z.string().catch("General"),
    lineRef: z.string().optional()
  })).catch([]),
  obligations: z.array(z.object({ text: z.string(), party: z.string().optional() })).catch([]),
  liabilities: z.array(z.object({ text: z.string(), party: z.string().optional() })).catch([]),
  privacyConcerns: z.array(z.object({
    title: z.string().catch("Privacy Concern"),
    description: z.string().catch("Review for privacy risks"),
    severity: RiskLevelSchema.catch("medium")
  })).catch([]),
  recommendations: z.array(z.object({
    title: z.string().catch("Recommendation"),
    description: z.string().catch("Review contract"),
    priority: RiskLevelSchema.catch("medium")
  })).catch([]),
  findings: z.array(z.object({
    title: z.string().catch("Finding"),
    description: z.string().catch(""),
    confidence: z.number().catch(50),
    tag: z.string().catch("General"),
    severity: RiskLevelSchema.catch("medium")
  })).catch([]),
  riskScore: z.number().catch(50),
  confidence: z.number().catch(50),
  riskCategories: z.array(z.string()).catch(["General"]),
});

function extractJsonFallback(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

const MAX_CONTRACT_CHARS = 80_000;

/** Default model for Google AI Studio (Gemini API). Override with GEMINI_MODEL. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** Fallback if the primary model is unavailable for this API key/region. */
const FALLBACK_MODELS = [
  "gemini-2.0-flash", 
  "gemini-2.5-flash-lite", 
  "gemini-1.5-pro", 
  "gemini-1.5-flash"
] as const;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
- 'critical' severity: illegal clauses, extreme liability without cap, or blatant violations of privacy laws.
- 'high' severity: severe financial liability, unlimited indemnification, loss of IP, or immediate termination without cause.
- 'medium' severity: non-standard auto-renewals, short notice periods, or ambiguous data usage rights.
- 'low' severity: standard boilerplate clauses that are slightly unfavorable but customary.
overallRisk MUST be 'critical' if >= 1 critical severity clause, 'high' if there is >= 1 high severity clause, 'medium' if >= 1 medium but no high, and 'low' otherwise.
You must also provide an overall riskScore (0-100), an overall confidence percentage (0-100), and an array of riskCategories strings summarizing the main areas of risk (e.g., "Liability", "Data Privacy", "Auto-Renewal").`;

function getModelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const candidates = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  return [...new Set(candidates)];
}

function shouldFallbackModel(error: unknown): boolean {
  if (error instanceof ApiError) {
    const msg = error.message.toLowerCase();
    return (
      error.status === 404 ||
      error.status === 503 ||
      error.status === 429 ||
      msg.includes("not found") ||
      msg.includes("is not supported") ||
      msg.includes("overloaded") ||
      msg.includes("high demand")
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
    const msg = error.message.toLowerCase();
    return (
      error.status === 503 ||
      error.status === 429 ||
      msg.includes("overloaded") ||
      msg.includes("high demand")
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
  const maxRetries = 2; // Maximum retries per model

  for (const model of models) {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const raw = await generateAnalysis(ai, model, trimmed);
        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch {
          const fallbackRaw = extractJsonFallback(raw);
          try {
            payload = JSON.parse(fallbackRaw);
          } catch {
            throw new Error("Failed to parse AI response. The response was malformed.");
          }
        }
        
        const validatedPayload = GeminiResponseSchema.parse(payload) as GeminiAnalysisPayload;
        return mapGeminiToAnalysisResult(validatedPayload, trimmed);
      } catch (error) {
        lastError = error;
        
        if (isRetryableError(error) && attempt < maxRetries) {
          attempt++;
          await delay(1500 * attempt); // Wait 1.5s, then 3s, etc. before retrying
          continue; // Retry the same model
        }
        
        if (shouldFallbackModel(error)) {
          break; // Stop retrying this model, proceed to the next fallback model
        }
        
        throw new Error(formatApiError(error));
      }
    }
  }

  throw new Error(
    `No supported Gemini model available. Tried: ${models.join(", ")}. ${formatApiError(lastError)}`,
  );
}
