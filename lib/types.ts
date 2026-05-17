export type RiskLevel = "low" | "medium" | "high";

export interface RiskScores {
  low: number;
  medium: number;
  high: number;
}

export interface RiskyClause {
  id: string;
  title: string;
  excerpt: string;
  severity: RiskLevel;
  category: string;
  lineRef?: string;
}

export interface ObligationItem {
  id: string;
  text: string;
  kind: "obligation" | "liability";
  party?: string;
}

export interface AIFinding {
  id: string;
  title: string;
  description: string;
  confidence: number;
  tag: string;
  severity: RiskLevel;
}

export interface PrivacyConcern {
  id: string;
  title: string;
  description: string;
  severity: RiskLevel;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: RiskLevel;
}

export interface AnalysisResult {
  riskScores: RiskScores;
  overallRisk: RiskLevel;
  riskyClauses: RiskyClause[];
  plainEnglish: string;
  obligations: ObligationItem[];
  findings: AIFinding[];
  privacyConcerns: PrivacyConcern[];
  recommendations: Recommendation[];
  analyzedAt: string;
  wordCount: number;
}

/** Raw JSON shape returned by Gemini */
export interface GeminiAnalysisPayload {
  overallRisk: RiskLevel;
  riskScores: RiskScores;
  plainEnglish: string;
  riskyClauses: Array<{
    title: string;
    excerpt: string;
    severity: RiskLevel;
    category: string;
    lineRef?: string;
  }>;
  obligations: Array<{ text: string; party?: string }>;
  liabilities: Array<{ text: string; party?: string }>;
  privacyConcerns: Array<{
    title: string;
    description: string;
    severity: RiskLevel;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: RiskLevel;
  }>;
  findings: Array<{
    title: string;
    description: string;
    confidence: number;
    tag: string;
    severity: RiskLevel;
  }>;
}
