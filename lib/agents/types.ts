/**
 * LexGuard Multi-Agent Architecture — Shared Types
 *
 * Defines the input/output contracts for every agent in the pipeline
 * and the shared orchestrator execution context.
 */

import type { AnalysisResult, RiskLevel, RiskyClause } from "../types";

// ---------------------------------------------------------------------------
// Agent Execution Context (passed through the orchestrator pipeline)
// ---------------------------------------------------------------------------

export interface AgentContext {
  /** Raw contract text submitted by the user */
  contractText: string;
  /** ISO timestamp when the orchestration run started */
  startedAt: string;
  /** Unique run identifier for log correlation */
  runId: string;
}

// ---------------------------------------------------------------------------
// Agent Result Envelope
// ---------------------------------------------------------------------------

export interface AgentResult<T> {
  /** Name of the agent that produced this result */
  agentName: string;
  /** Whether the agent completed successfully */
  success: boolean;
  /** Agent payload on success */
  data?: T;
  /** Error message if the agent failed */
  error?: string;
  /** Wall-clock ms the agent took */
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Risk Detector Agent — I/O
// ---------------------------------------------------------------------------

export interface RiskDetectorInput {
  contractText: string;
}

export interface RiskDetectorOutput {
  overallRisk: RiskLevel;
  riskScore: number;
  confidence: number;
  riskCategories: string[];
  documentType: string;
  documentTypeConfidence: number;
  riskScores: { low: number; medium: number; high: number; critical: number };
  riskyClauses: RiskyClause[];
  obligations: AnalysisResult["obligations"];
  liabilities: Array<{ text: string; party?: string }>;
  privacyConcerns: AnalysisResult["privacyConcerns"];
  recommendations: AnalysisResult["recommendations"];
  findings: AnalysisResult["findings"];
  /** Raw plain-English summary from the Risk Detector (pre-simplification) */
  rawSummary: string;
  wordCount: number;
}

// ---------------------------------------------------------------------------
// Legal Simplifier Agent — I/O
// ---------------------------------------------------------------------------

export interface LegalSimplifierInput {
  /** Raw plain-English summary to enrich */
  rawSummary: string;
  /** Risky clauses to produce user-friendly interpretations for */
  riskyClauses: RiskyClause[];
  /** Overall risk level for tone calibration */
  overallRisk: RiskLevel;
  /** Detected document type for context */
  documentType: string;
}

export interface SimplifiedClause {
  /** Matches the id of the source RiskyClause */
  clauseId: string;
  /** User-friendly title (plain language) */
  friendlyTitle: string;
  /** Plain-English explanation of what this clause means for the user */
  plainExplanation: string;
  /** What the user should do about it */
  actionAdvice: string;
  /** Simplified severity label */
  severityLabel: string;
}

export interface LegalSimplifierOutput {
  /** Polished, user-friendly executive summary */
  executiveSummary: string;
  /** Simplified interpretations per risky clause */
  simplifiedClauses: SimplifiedClause[];
  /** One-sentence TLDR for the whole contract */
  tldr: string;
  /** Key actions the user should take */
  keyActions: string[];
}

// ---------------------------------------------------------------------------
// Negotiation Recommender Agent — I/O
// ---------------------------------------------------------------------------

export interface NegotiationRecommenderInput {
  /** Risky clauses from the Risk Detector */
  riskyClauses: RiskyClause[];
  /** Overall risk level */
  overallRisk: RiskLevel;
  /** Risk score 0-100 */
  riskScore: number;
  /** Detected document type */
  documentType: string;
  /** Risk categories identified */
  riskCategories: string[];
  /** Per-clause simplifications from Legal Simplifier (optional, for richer prompts) */
  simplifiedClauses?: Record<string, SimplifiedClause>;
  /** Key user actions from Legal Simplifier (optional) */
  keyActions?: string[];
}

export interface NegotiationRecommendation {
  /** Matches the id of the source RiskyClause */
  clauseId: string;
  /** Clause title for display */
  clauseTitle: string;
  /** What is problematic about this clause */
  issue: string;
  /** Specific negotiation recommendation */
  recommendation: string;
  /** Business/financial impact if not negotiated */
  businessImpact: string;
  /** Optional: suggested safer alternative wording */
  alternativeWording?: string;
  /** How urgently this should be negotiated */
  priority: RiskLevel;
  /** Whether this clause is typically negotiable in practice */
  negotiable: boolean;
}

export interface NegotiationRecommenderOutput {
  /** Overall negotiation strategy for this contract */
  negotiationStrategy: string;
  /** Per-clause negotiation recommendations */
  recommendations: NegotiationRecommendation[];
  /** User's overall negotiation leverage */
  overallLeverage: "strong" | "moderate" | "weak";
  /** Single sentence on where to focus negotiation energy */
  priorityFocus: string;
  /** Conditions where walking away is advisable */
  walkAwayTriggers: string[];
  /** Easy asks that are commonly accepted */
  quickWins: string[];
}

// ---------------------------------------------------------------------------
// Orchestrator Final Output
// ---------------------------------------------------------------------------

export interface OrchestratorResult {
  /** Full analysis result (risk data + all agent layers merged) */
  analysis: AnalysisResult & {
    /** Polished executive summary from the Legal Simplifier */
    executiveSummary: string;
    /** Short TLDR sentence */
    tldr: string;
    /** Key user actions */
    keyActions: string[];
    /** Per-clause simplifications keyed by clause id */
    simplifiedClauses: Record<string, SimplifiedClause>;
    /** Negotiation strategy from Negotiation Recommender */
    negotiationStrategy: string;
    /** Per-clause negotiation recommendations keyed by clauseId */
    negotiationRecommendations: Record<string, NegotiationRecommendation>;
    /** Overall negotiation leverage */
    overallLeverage: "strong" | "moderate" | "weak";
    /** Priority focus sentence */
    negotiationPriorityFocus: string;
    /** Walk-away triggers */
    walkAwayTriggers: string[];
    /** Quick wins */
    quickWins: string[];
  };
  /** Per-agent execution metadata for observability */
  agentTrace: Array<{
    agentName: string;
    success: boolean;
    durationMs: number;
    error?: string;
  }>;
  /** Total orchestration wall-clock time in ms */
  totalDurationMs: number;
  /** Unique run id for log correlation */
  runId: string;
}
