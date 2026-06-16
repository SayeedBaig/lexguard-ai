export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RiskScores {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface RiskyClause {
  id: string;
  title: string;
  excerpt: string;
  explanation: string;
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

// ---------------------------------------------------------------------------
// Legal Simplifier enrichment types (added by multi-agent pipeline)
// ---------------------------------------------------------------------------

export interface SimplifiedClause {
  clauseId: string;
  friendlyTitle: string;
  plainExplanation: string;
  actionAdvice: string;
  severityLabel: string;
}

// ---------------------------------------------------------------------------
// Negotiation Recommender enrichment types (added by multi-agent pipeline)
// ---------------------------------------------------------------------------

export interface NegotiationRecommendation {
  clauseId: string;
  clauseTitle: string;
  issue: string;
  recommendation: string;
  businessImpact: string;
  alternativeWording?: string;
  priority: RiskLevel;
  negotiable: boolean;
}

export interface AnalysisResult {
  riskScores: RiskScores;
  overallRisk: RiskLevel;
  /** AI-detected contract or document category */
  documentType: string;
  documentTypeConfidence: number;
  riskyClauses: RiskyClause[];
  plainEnglish: string;
  obligations: ObligationItem[];
  findings: AIFinding[];
  privacyConcerns: PrivacyConcern[];
  recommendations: Recommendation[];
  analyzedAt: string;
  wordCount: number;
  riskScore: number;
  confidence: number;
  riskCategories: string[];
  // ---- Multi-agent enrichment fields (Legal Simplifier Agent output) ----
  /** Polished executive summary from Legal Simplifier Agent */
  executiveSummary?: string;
  /** One-sentence TLDR for the contract */
  tldr?: string;
  /** Key actions the user should take */
  keyActions?: string[];
  /** Per-clause plain-English simplifications keyed by clause id */
  simplifiedClauses?: Record<string, SimplifiedClause>;
  // ---- Multi-agent enrichment fields (Negotiation Recommender Agent output) ----
  /** Overall negotiation strategy */
  negotiationStrategy?: string;
  /** Per-clause negotiation recommendations keyed by clauseId */
  negotiationRecommendations?: Record<string, NegotiationRecommendation>;
  /** User's overall negotiation leverage */
  overallLeverage?: "strong" | "moderate" | "weak";
  /** Where to focus negotiation energy */
  negotiationPriorityFocus?: string;
  /** Walk-away conditions */
  walkAwayTriggers?: string[];
  /** Easy negotiation wins */
  quickWins?: string[];
  /** Multi-agent pipeline metadata (attached by orchestrator) */
  _agentTrace?: Array<{ agentName: string; success: boolean; durationMs: number; error?: string }>;
  _runId?: string;
}

/** Raw JSON shape returned by Gemini */
export interface GeminiAnalysisPayload {
  overallRisk: RiskLevel;
  documentType: string;
  documentTypeConfidence: number;
  riskScores: RiskScores;
  plainEnglish: string;
  riskyClauses: Array<{
    title: string;
    excerpt: string;
    explanation: string;
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
  riskScore?: number;
  confidence?: number;
  riskCategories?: string[];
}
