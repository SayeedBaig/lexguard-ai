/**
 * LexGuard — Contract QA Agent (v2)
 *
 * Fixes in v2:
 *  - Stronger grounding prompt — model MUST search the contract before responding
 *  - Domain restriction: off-topic questions are rejected with a clear message
 *  - Better citation extraction with contextual labels
 *  - Higher temperature for less repetitive answers
 *  - Structured two-part prompt: system context + user turn clearly separated
 *  - Explicit off-topic detection before calling the model
 *  - Contract length guard with informative truncation notice
 */

import { ApiError, GoogleGenAI } from "@google/genai";
import { createAgentLogger } from "./logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: CitedClause[];
}

export interface CitedClause {
  label: string;
  excerpt: string;
}

export interface ContractQAInput {
  contractText: string;
  question: string;
  history?: ChatMessage[];
  documentType?: string;
}

export interface ContractQAOutput {
  answer: string;
  citations: CitedClause[];
  grounded: boolean;
  offTopic?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_NAME = "ContractQAAgent";
const DEFAULT_MODEL = "gemini-2.5-flash";
const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
] as const;

const MAX_CONTRACT_CHARS = 75_000;
const MAX_HISTORY_TURNS = 8;
const MAX_RETRIES = 2;

// ---------------------------------------------------------------------------
// Domain Restriction — off-topic question detection
// ---------------------------------------------------------------------------

const OFF_TOPIC_PATTERNS = [
  /\b(weather|sports|news|politics|cook(ing|ed|s)?|recipe|game|movie|music|song|celebrity|how to (make|build|draw|code(?! a contract)|hack|install|download))\b/i,
  /\b(what is the capital|who is the president|what year|history of|translate|explain quantum|write me a poem|write me a song|write me code)\b/i,
  /\b(stock (price|market)|crypto|bitcoin|investment|tax (advice|return|filing))\b/i,
  /\b(relationship advice|medical advice|doctor|therapy|personal finance)\b/i,
];

const CONTRACT_KEYWORDS = [
  /\b(contract|agreement|clause|term|section|party|parties|provision|obligation|liability|indemnif|terminat|renew|notice|ip|intellectual property|data|privacy|payment|fee|warranty|jurisdict|govern|arbitrat|confidential|non.?compet|force majeure|sla|deliverable|scope|remedy|breach|default|damages|penalty)\b/i,
];

function isOffTopic(question: string): boolean {
  // If it contains a clear contract keyword, allow it
  const hasContractKeyword = CONTRACT_KEYWORDS.some((re) => re.test(question));
  if (hasContractKeyword) return false;

  // Check for explicit off-topic patterns
  return OFF_TOPIC_PATTERNS.some((re) => re.test(question));
}

const OFF_TOPIC_RESPONSE: ContractQAOutput = {
  answer:
    "I can only answer questions about the contract you've analyzed. I'm not able to help with topics unrelated to this contract.\n\nTry asking about:\n• Termination conditions or notice periods\n• Liability caps or indemnification\n• Auto-renewal terms\n• Intellectual property ownership\n• Data collection and privacy clauses\n• Your obligations and rights under this contract",
  citations: [],
  grounded: false,
  offTopic: true,
};

// ---------------------------------------------------------------------------
// System Prompt (v2 — stronger grounding enforcement)
// ---------------------------------------------------------------------------

function buildSystemPrompt(documentType?: string): string {
  const docContext = documentType
    ? ` You are analyzing a ${documentType}.`
    : "";

  return `You are LexGuard Contract Assistant — a precise, contract-aware legal Q&A assistant.${docContext}

YOUR JOB:
Answer questions based EXCLUSIVELY on the contract text provided below the separator line. 
You must search through the contract text carefully before answering.

STRICT RULES:
1. READ the full contract text before answering.
2. If you find relevant text, quote it directly and explain what it means.
3. If you find NOTHING relevant in the contract, say: "This contract does not appear to address [topic]." — do NOT invent or speculate.
4. NEVER give generic legal advice. Answer from THIS specific contract only.
5. Do not repeat answers from prior turns — each answer must be specific to what the contract says.

CITATION FORMAT:
When quoting the contract, use exactly this format:
[Clause: "exact text from the contract, up to 100 words"]

RESPONSE FORMAT:
1. Start with a direct 1-sentence answer
2. Cite the relevant clause(s) using the format above
3. Explain what it means in plain English for a non-lawyer
4. Note any risks or important caveats if applicable
5. End your response with EXACTLY one of:
   GROUNDED:YES  — you found the answer in the contract
   GROUNDED:NO   — the contract does not address this topic

TONE: Direct, factual, helpful. Not legal advice.`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

/**
 * Parse the text response into ContractQAOutput.
 * Extracts GROUNDED marker and [Clause: "..."] citations with better labeling.
 */
function parseResponse(rawText: string): ContractQAOutput {
  const text = rawText.trim();
  const grounded = text.includes("GROUNDED:YES");

  // Remove marker lines
  const answerText = text
    .replace(/^GROUNDED:(YES|NO)\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Extract citations with context-aware labels
  const citationRegex = /\[Clause:\s*"([^"]{10,})"\]/g;
  const citations: CitedClause[] = [];
  let match;
  let clauseIndex = 1;

  while ((match = citationRegex.exec(answerText)) !== null) {
    const excerpt = match[1].trim();
    if (excerpt && !citations.some((c) => c.excerpt === excerpt)) {
      // Try to extract a section number from the excerpt (e.g., "8.2", "Section 3")
      const sectionMatch = excerpt.match(/^(?:Section\s+)?(\d+[\.\d]*)\s+/i);
      const label = sectionMatch
        ? `Section ${sectionMatch[1]}`
        : `Clause ${clauseIndex}`;
      citations.push({ label, excerpt });
      clauseIndex++;
    }
  }

  return { answer: answerText, citations, grounded };
}

/**
 * Build the full prompt with contract text + history + current question.
 * The contract text is included in the user turn (not system) to ensure
 * Gemini actually reads it against the question.
 */
function buildPrompt(input: ContractQAInput): string {
  const contractText = input.contractText;
  const truncated = contractText.length > MAX_CONTRACT_CHARS;
  const contractSnippet = contractText.slice(0, MAX_CONTRACT_CHARS);

  const truncationNote = truncated
    ? `\n[Note: Contract truncated to ${MAX_CONTRACT_CHARS.toLocaleString()} characters for processing]\n`
    : "";

  // Format history — trim to last N turns, skip citation data
  const recentHistory = (input.history ?? [])
    .slice(-MAX_HISTORY_TURNS)
    .map((m) => {
      const role = m.role === "user" ? "User" : "Assistant";
      // Strip the GROUNDED marker from history if present
      const content = m.content
        .replace(/^GROUNDED:(YES|NO)\s*$/gm, "")
        .trim();
      return `${role}: ${content}`;
    })
    .join("\n\n");

  const historySection = recentHistory
    ? `\n=== PRIOR CONVERSATION ===\n${recentHistory}\n=== END PRIOR CONVERSATION ===\n\n`
    : "";

  return `${historySection}=== CONTRACT TEXT ===
${truncationNote}
${contractSnippet}
=== END CONTRACT TEXT ===

Now answer this question based ONLY on the contract text above:
QUESTION: ${input.question}

Search the contract text carefully. Quote the relevant clauses. If not addressed in the contract, say so clearly.`;
}

// ---------------------------------------------------------------------------
// Core Gemini Call
// ---------------------------------------------------------------------------

async function callGemini(
  ai: GoogleGenAI,
  model: string,
  input: ContractQAInput,
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: buildPrompt(input),
    config: {
      systemInstruction: buildSystemPrompt(input.documentType),
      temperature: 0.25,  // Higher than before — forces varied, specific answers
      topK: 20,
      topP: 0.95,
      maxOutputTokens: 1500,
    },
  });

  const text = response.text;
  if (!text?.trim()) {
    throw new Error("Contract QA Agent: Gemini returned an empty response.");
  }
  return text;
}

// ---------------------------------------------------------------------------
// Contract QA Agent — Main Entry Point
// ---------------------------------------------------------------------------

export async function runContractQAAgent(
  input: ContractQAInput,
  runId: string = "qa-" + Date.now(),
): Promise<ContractQAOutput> {
  const logger = createAgentLogger(AGENT_NAME, runId);
  const startTime = Date.now();

  // Guard: contract text must be present
  if (!input.contractText?.trim()) {
    logger.error("Contract text is missing or empty — refusing to call model", {
      contractLength: input.contractText?.length ?? 0,
    });
    throw new Error(
      "No contract text found. Please analyze a contract first before asking questions.",
    );
  }

  logger.start({
    questionLength: input.question.length,
    historyTurns: input.history?.length ?? 0,
    contractLength: input.contractText.length,
    documentType: input.documentType ?? "unknown",
  });

  // Guard: question must be present
  if (!input.question.trim()) {
    throw new Error("Question cannot be empty.");
  }

  // Domain restriction — off-topic detection (before calling model)
  if (isOffTopic(input.question)) {
    logger.info("Off-topic question detected — returning restriction response", {
      question: input.question.slice(0, 100),
    });
    return OFF_TOPIC_RESPONSE;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
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
        const output = parseResponse(raw);

        logger.complete(Date.now() - startTime, {
          model,
          grounded: output.grounded,
          citationCount: output.citations.length,
          answerLength: output.answer.length,
        });

        return output;
      } catch (error) {
        lastError = error;

        if (isRetryableError(error) && attempt < MAX_RETRIES) {
          attempt++;
          const waitMs = 1500 * attempt;
          logger.warn(`Retryable error — waiting ${waitMs}ms`, {
            model,
            error: error instanceof Error ? error.message : String(error),
          });
          await delay(waitMs);
          continue;
        }

        if (shouldFallbackModel(error)) {
          logger.warn(`Model ${model} unavailable — trying next`, {
            error: error instanceof Error ? error.message : String(error),
          });
          break;
        }

        throw error;
      }
    }
  }

  logger.fail(Date.now() - startTime, lastError);
  throw new Error(
    `Contract QA failed. Tried: ${models.join(", ")}. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}
