/**
 * LexGuard AI Risk Scoring Engine
 * Validates, classifies, and normalizes structured AI risk intelligence.
 */

import type { AnalysisResult, RiskLevel, RiskScores } from "./types";

// ---------------------------------------------------------------------------
// Severity Classification
// ---------------------------------------------------------------------------

export type SeverityMeta = {
  level: RiskLevel;
  label: string;
  description: string;
  colorClass: string;
  score: number; // representative midpoint score for this tier
};

export const SEVERITY_MAP: Record<RiskLevel, SeverityMeta> = {
  low: {
    level: "low",
    label: "Low",
    description: "Standard boilerplate with minor unfavorable provisions.",
    colorClass: "text-emerald-700",
    score: 20,
  },
  medium: {
    level: "medium",
    label: "Medium",
    description: "Non-standard terms that warrant careful review.",
    colorClass: "text-amber-700",
    score: 50,
  },
  high: {
    level: "high",
    label: "High",
    description: "Significant financial or legal risk — seek negotiation or advice.",
    colorClass: "text-red-700",
    score: 75,
  },
  critical: {
    level: "critical",
    label: "Critical",
    description: "Potentially illegal or extremely harmful provisions — do not sign without legal counsel.",
    colorClass: "text-red-900",
    score: 95,
  },
};

// ---------------------------------------------------------------------------
// Score Normalization
// ---------------------------------------------------------------------------

/** Clamp a numeric value to [0, 100] and round to nearest integer. */
export function clampScore(value: number, fallback = 50): number {
  if (typeof value !== "number" || isNaN(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Normalize a RiskLevel string, defaulting to 'medium' for unknown values. */
export function normalizeSeverity(value: unknown): RiskLevel {
  const v = String(value ?? "").toLowerCase();
  if (v === "low" || v === "medium" || v === "high" || v === "critical") {
    return v as RiskLevel;
  }
  return "medium";
}

// ---------------------------------------------------------------------------
// Derived Risk Score Calculation (fallback when Gemini doesn't provide one)
// ---------------------------------------------------------------------------

/**
 * Compute a weighted 0–100 risk score from clause severity counts.
 * Weights: critical=30, high=20, medium=10, low=5
 * Uses overallRisk tier as a floor to prevent under-scoring.
 */
export function computeWeightedRiskScore(
  scores: RiskScores,
  overallRisk: RiskLevel
): number {
  const total =
    (scores.critical || 0) +
    (scores.high || 0) +
    (scores.medium || 0) +
    (scores.low || 0);

  let weighted: number;

  if (total === 0) {
    // Tier-based floor when no individual clause counts exist
    const tierFloors: Record<RiskLevel, number> = {
      critical: 90,
      high: 72,
      medium: 48,
      low: 20,
    };
    return tierFloors[overallRisk];
  }

  weighted =
    (scores.critical || 0) * 30 +
    (scores.high || 0) * 20 +
    (scores.medium || 0) * 10 +
    (scores.low || 0) * 5;

  const raw = Math.round(weighted / total);

  // Apply tier floors to prevent contradictory score/severity combos
  const minByTier: Record<RiskLevel, number> = {
    critical: 85,
    high: 60,
    medium: 35,
    low: 0,
  };

  return Math.min(100, Math.max(minByTier[overallRisk], raw));
}

// ---------------------------------------------------------------------------
// Derived Severity from Score (for display fallback)
// ---------------------------------------------------------------------------

/** Classify an overall severity level from a numeric score. */
export function classifySeverityFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// Risk Category Normalization
// ---------------------------------------------------------------------------

const KNOWN_CATEGORIES = [
  "Liability",
  "Indemnification",
  "Data Privacy",
  "Auto-Renewal",
  "Termination",
  "IP Rights",
  "Jurisdiction",
  "Confidentiality",
  "Payment Terms",
  "Force Majeure",
  "Warranties",
  "Governance",
  "Employment",
  "Non-Compete",
  "SLA",
  "General",
];

/**
 * Normalize and deduplicate risk categories.
 * Falls back to clause categories if Gemini didn't provide a list.
 */
export function normalizeRiskCategories(
  categories: unknown,
  clauseCategories: string[] = []
): string[] {
  let cats: string[] = [];

  if (Array.isArray(categories) && categories.length > 0) {
    cats = (categories as unknown[])
      .map((c) => String(c).trim())
      .filter(Boolean);
  } else if (clauseCategories.length > 0) {
    cats = clauseCategories;
  } else {
    cats = ["General"];
  }

  // Deduplicate (case-insensitive)
  const seen = new Set<string>();
  return cats.filter((c) => {
    const key = c.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Full Validation + Normalization Pass
// ---------------------------------------------------------------------------

/**
 * Validate and normalize a full AnalysisResult produced by mapGeminiResponse.
 * Ensures riskScore, confidence, severity, and riskCategories are always
 * consistent and within valid ranges before saving to DB or returning to UI.
 */
export function normalizeAnalysisResult(result: AnalysisResult): AnalysisResult {
  const overallRisk = normalizeSeverity(result.overallRisk);

  // Ensure riskScore is valid; recompute from clause counts if needed
  const riskScore =
    typeof result.riskScore === "number" && result.riskScore > 0
      ? clampScore(result.riskScore)
      : computeWeightedRiskScore(result.riskScores, overallRisk);

  // Ensure confidence is in range
  const confidence = clampScore(result.confidence ?? result.documentTypeConfidence, 70);

  // Derive clause categories for fallback
  const clauseCategories = (result.riskyClauses ?? [])
    .map((c) => c.category)
    .filter(Boolean);

  const riskCategories = normalizeRiskCategories(result.riskCategories, clauseCategories);

  return {
    ...result,
    overallRisk,
    riskScore,
    confidence,
    riskCategories,
    riskScores: {
      low: Math.max(0, result.riskScores?.low || 0),
      medium: Math.max(0, result.riskScores?.medium || 0),
      high: Math.max(0, result.riskScores?.high || 0),
      critical: Math.max(0, result.riskScores?.critical || 0),
    },
  };
}

// ---------------------------------------------------------------------------
// DB Payload Extractor
// ---------------------------------------------------------------------------

/** Extract only the fields stored as dedicated DB columns from an AnalysisResult. */
export function extractRiskIntelligenceForDb(result: AnalysisResult) {
  return {
    riskScore: result.riskScore,
    severity: result.overallRisk,
    confidence: result.confidence,
    riskCategories: result.riskCategories,
  };
}
