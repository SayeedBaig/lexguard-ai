import type {
  AnalysisResult,
  GeminiAnalysisPayload,
  RiskLevel,
} from "./types";

function uid(prefix: string, index: number) {
  return `${prefix}-${index}`;
}

function normalizeRisk(value: string): RiskLevel {
  const v = value?.toLowerCase();
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

function clampConfidence(n: number): number {
  if (Number.isNaN(n)) return 75;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function mapGeminiToAnalysisResult(
  payload: GeminiAnalysisPayload,
  contractText: string,
): AnalysisResult {
  const wordCount = contractText.trim().split(/\s+/).filter(Boolean).length;

  const riskyClauses = (payload.riskyClauses ?? []).map((c, i) => ({
    id: uid("clause", i),
    title: c.title || "Flagged clause",
    excerpt: c.excerpt || "",
    severity: normalizeRisk(c.severity),
    category: c.category || "General",
    lineRef: c.lineRef,
  }));

  const obligationItems = (payload.obligations ?? []).map((o, i) => ({
    id: uid("obligation", i),
    text: o.text,
    kind: "obligation" as const,
    party: o.party,
  }));

  const liabilityItems = (payload.liabilities ?? []).map((l, i) => ({
    id: uid("liability", i),
    text: l.text,
    kind: "liability" as const,
    party: l.party,
  }));

  const scores = payload.riskScores ?? { low: 0, medium: 0, high: 0 };

  return {
    overallRisk: normalizeRisk(payload.overallRisk),
    riskScores: {
      low: Math.max(0, Number(scores.low) || 0),
      medium: Math.max(0, Number(scores.medium) || 0),
      high: Math.max(0, Number(scores.high) || 0),
    },
    plainEnglish: payload.plainEnglish || "No summary available.",
    riskyClauses,
    obligations: [...obligationItems, ...liabilityItems],
    findings: (payload.findings ?? []).map((f, i) => ({
      id: uid("finding", i),
      title: f.title,
      description: f.description,
      confidence: clampConfidence(Number(f.confidence)),
      tag: f.tag || "General",
      severity: normalizeRisk(f.severity),
    })),
    privacyConcerns: (payload.privacyConcerns ?? []).map((p, i) => ({
      id: uid("privacy", i),
      title: p.title,
      description: p.description,
      severity: normalizeRisk(p.severity),
    })),
    recommendations: (payload.recommendations ?? []).map((r, i) => ({
      id: uid("recommendation", i),
      title: r.title,
      description: r.description,
      priority: normalizeRisk(r.priority),
    })),
    analyzedAt: new Date().toISOString(),
    wordCount,
  };
}
