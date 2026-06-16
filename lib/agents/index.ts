/**
 * LexGuard Multi-Agent Architecture — Public Barrel Export
 */

export { orchestrateContractAnalysis } from "./orchestrator";
export { runRiskDetectorAgent } from "./riskDetectorAgent";
export { runLegalSimplifierAgent } from "./legalSimplifierAgent";
export { runNegotiationRecommenderAgent } from "./negotiationAgent";
export { runContractQAAgent } from "./contractQAAgent";
export type {
  AgentContext,
  AgentResult,
  RiskDetectorInput,
  RiskDetectorOutput,
  LegalSimplifierInput,
  LegalSimplifierOutput,
  SimplifiedClause,
  NegotiationRecommenderInput,
  NegotiationRecommenderOutput,
  NegotiationRecommendation,
  OrchestratorResult,
} from "./types";
export type {
  ChatMessage,
  CitedClause,
  ContractQAInput,
  ContractQAOutput,
} from "./contractQAAgent";

