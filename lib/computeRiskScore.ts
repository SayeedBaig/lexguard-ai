import type { RiskLevel, RiskScores } from "./types";

/** Weighted 0–100 score from severity distribution (higher = riskier). */
export function computeOverallRiskScore(
  scores: RiskScores,
  overallRisk: RiskLevel,
): number {
  const total = scores.low + scores.medium + scores.high;
  if (total === 0) {
    if (overallRisk === "high") return 78;
    if (overallRisk === "medium") return 52;
    return 24;
  }
  const weighted =
    scores.high * 100 + scores.medium * 58 + scores.low * 18;
  return Math.min(100, Math.max(0, Math.round(weighted / total)));
}

export function riskScoreLabel(score: number): string {
  if (score >= 70) return "Elevated";
  if (score >= 45) return "Moderate";
  return "Favorable";
}
