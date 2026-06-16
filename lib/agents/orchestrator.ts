/**
 * LexGuard — AI Orchestrator
 *
 * Central coordination layer for the multi-agent analysis pipeline.
 *
 * Pipeline (sequential):
 *   1. Risk Detector Agent        — risk scoring, clause extraction, categorization
 *   2. Legal Simplifier Agent     — plain-English summaries, clause explanations, actions
 *   3. Negotiation Recommender    — negotiation strategy, clause-level guidance, alt wording
 *
 * Design principles:
 *  - Each agent is isolated; the orchestrator only passes typed data between them
 *  - Risk Detector failure is fatal (no base data to work with)
 *  - Legal Simplifier + Negotiation failures are non-fatal (graceful degraded output)
 *  - Full agent execution trace is attached to every result for observability
 *  - Add a new agent: implement lib/agents/<name>Agent.ts → add call below step 3
 */

import { randomUUID } from "crypto";

import { runRiskDetectorAgent } from "./riskDetectorAgent";
import { runLegalSimplifierAgent } from "./legalSimplifierAgent";
import { runNegotiationRecommenderAgent } from "./negotiationAgent";
import { createAgentLogger } from "./logger";

import type {
  AgentContext,
  AgentResult,
  LegalSimplifierOutput,
  NegotiationRecommendation,
  NegotiationRecommenderOutput,
  OrchestratorResult,
  RiskDetectorOutput,
  SimplifiedClause,
} from "./types";

const ORCHESTRATOR_NAME = "Orchestrator";

// ---------------------------------------------------------------------------
// Result Merger
// ---------------------------------------------------------------------------

function mergeAgentOutputs(
  riskData: RiskDetectorOutput,
  simplifierData: LegalSimplifierOutput,
  negotiationData: NegotiationRecommenderOutput,
): OrchestratorResult["analysis"] {
  // Index simplified clauses by clauseId for O(1) frontend lookup
  const simplifiedClausesMap: Record<string, SimplifiedClause> = {};
  for (const sc of simplifierData.simplifiedClauses) {
    simplifiedClausesMap[sc.clauseId] = sc;
  }

  // Index negotiation recommendations by clauseId for O(1) frontend lookup
  const negotiationMap: Record<string, NegotiationRecommendation> = {};
  for (const rec of negotiationData.recommendations) {
    negotiationMap[rec.clauseId] = rec;
  }

  return {
    // ---- Risk Detector fields (unchanged, backwards-compatible) ----
    overallRisk: riskData.overallRisk,
    riskScore: riskData.riskScore,
    confidence: riskData.confidence,
    riskCategories: riskData.riskCategories,
    documentType: riskData.documentType,
    documentTypeConfidence: riskData.documentTypeConfidence,
    riskScores: riskData.riskScores,
    riskyClauses: riskData.riskyClauses,
    obligations: riskData.obligations,
    privacyConcerns: riskData.privacyConcerns,
    recommendations: riskData.recommendations,
    findings: riskData.findings,
    wordCount: riskData.wordCount,
    analyzedAt: new Date().toISOString(),

    // ---- Legacy field — kept for backwards compat ----
    plainEnglish: simplifierData.executiveSummary || riskData.rawSummary,

    // ---- Legal Simplifier enrichment ----
    executiveSummary: simplifierData.executiveSummary,
    tldr: simplifierData.tldr,
    keyActions: simplifierData.keyActions,
    simplifiedClauses: simplifiedClausesMap,

    // ---- Negotiation Recommender enrichment ----
    negotiationStrategy: negotiationData.negotiationStrategy,
    negotiationRecommendations: negotiationMap,
    overallLeverage: negotiationData.overallLeverage,
    negotiationPriorityFocus: negotiationData.priorityFocus,
    walkAwayTriggers: negotiationData.walkAwayTriggers,
    quickWins: negotiationData.quickWins,
  };
}

// ---------------------------------------------------------------------------
// Orchestrator — Main Entry Point
// ---------------------------------------------------------------------------

export async function orchestrateContractAnalysis(
  contractText: string,
): Promise<OrchestratorResult> {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  const orchestratorStart = Date.now();

  const ctx: AgentContext = { contractText, startedAt, runId };
  const logger = createAgentLogger(ORCHESTRATOR_NAME, runId);
  const agentTrace: OrchestratorResult["agentTrace"] = [];

  logger.info("Pipeline started", {
    contractLength: contractText.length,
    contractWords: contractText.trim().split(/\s+/).length,
  });

  // -------------------------------------------------------------------------
  // STEP 1: Risk Detector Agent (FATAL on failure)
  // -------------------------------------------------------------------------
  logger.info("Running agent [1/3]: RiskDetectorAgent");

  const riskResult: AgentResult<RiskDetectorOutput> = await runRiskDetectorAgent(
    { contractText },
    ctx,
  );

  agentTrace.push({
    agentName: riskResult.agentName,
    success: riskResult.success,
    durationMs: riskResult.durationMs,
    error: riskResult.error,
  });

  if (!riskResult.success || !riskResult.data) {
    const totalDurationMs = Date.now() - orchestratorStart;
    logger.error("Pipeline aborted — Risk Detector failed", {
      error: riskResult.error,
      totalDurationMs,
    });
    throw new Error(riskResult.error ?? "Risk analysis failed. Please try again.");
  }

  logger.info("RiskDetectorAgent completed", {
    overallRisk: riskResult.data.overallRisk,
    riskScore: riskResult.data.riskScore,
    clauseCount: riskResult.data.riskyClauses.length,
  });

  // -------------------------------------------------------------------------
  // STEP 2: Legal Simplifier Agent (non-fatal)
  // -------------------------------------------------------------------------
  logger.info("Running agent [2/3]: LegalSimplifierAgent");

  const simplifierResult: AgentResult<LegalSimplifierOutput> = await runLegalSimplifierAgent(
    {
      rawSummary: riskResult.data.rawSummary,
      riskyClauses: riskResult.data.riskyClauses,
      overallRisk: riskResult.data.overallRisk,
      documentType: riskResult.data.documentType,
    },
    ctx,
  );

  agentTrace.push({
    agentName: simplifierResult.agentName,
    success: simplifierResult.success,
    durationMs: simplifierResult.durationMs,
    error: simplifierResult.error,
  });

  if (!simplifierResult.success) {
    logger.warn("LegalSimplifierAgent failed — using degraded fallback", {
      error: simplifierResult.error,
    });
  } else {
    logger.info("LegalSimplifierAgent completed", {
      simplifiedClauseCount: simplifierResult.data?.simplifiedClauses?.length ?? 0,
      keyActionCount: simplifierResult.data?.keyActions?.length ?? 0,
    });
  }

  const simplifierData: LegalSimplifierOutput = simplifierResult.data!;

  // Build simplified clause map for passing to Negotiation Agent
  const simplifiedClausesMap: Record<string, import("./types").SimplifiedClause> = {};
  for (const sc of simplifierData.simplifiedClauses) {
    simplifiedClausesMap[sc.clauseId] = sc;
  }

  // -------------------------------------------------------------------------
  // STEP 3: Negotiation Recommender Agent (non-fatal)
  // -------------------------------------------------------------------------
  logger.info("Running agent [3/3]: NegotiationRecommenderAgent");

  const negotiationResult: AgentResult<NegotiationRecommenderOutput> =
    await runNegotiationRecommenderAgent(
      {
        riskyClauses: riskResult.data.riskyClauses,
        overallRisk: riskResult.data.overallRisk,
        riskScore: riskResult.data.riskScore,
        documentType: riskResult.data.documentType,
        riskCategories: riskResult.data.riskCategories,
        simplifiedClauses: simplifiedClausesMap,
        keyActions: simplifierData.keyActions,
      },
      ctx,
    );

  agentTrace.push({
    agentName: negotiationResult.agentName,
    success: negotiationResult.success,
    durationMs: negotiationResult.durationMs,
    error: negotiationResult.error,
  });

  if (!negotiationResult.success) {
    logger.warn("NegotiationRecommenderAgent failed — using degraded fallback", {
      error: negotiationResult.error,
    });
  } else {
    logger.info("NegotiationRecommenderAgent completed", {
      recommendationCount: negotiationResult.data?.recommendations?.length ?? 0,
      overallLeverage: negotiationResult.data?.overallLeverage,
      quickWinCount: negotiationResult.data?.quickWins?.length ?? 0,
    });
  }

  const negotiationData: NegotiationRecommenderOutput = negotiationResult.data!;

  // -------------------------------------------------------------------------
  // Merge all agent outputs
  // -------------------------------------------------------------------------
  const analysis = mergeAgentOutputs(riskResult.data, simplifierData, negotiationData);

  const totalDurationMs = Date.now() - orchestratorStart;

  logger.info("Pipeline completed", {
    totalDurationMs,
    agentCount: agentTrace.length,
    allSucceeded: agentTrace.every((a) => a.success),
    overallRisk: analysis.overallRisk,
    riskScore: analysis.riskScore,
  });

  return { analysis, agentTrace, totalDurationMs, runId };
}
