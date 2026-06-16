# LexGuard Multi-Agent AI Architecture

## Overview

LexGuard uses a modular multi-agent pipeline where each agent has its own
isolated prompt, response schema, Zod validation, and service module.
The central orchestrator coordinates the analysis pipeline.
The Contract QA Agent runs independently per user question (not in the orchestrator pipeline).

## Pipeline

```
POST /api/analyze
        │
        ▼
  AI Orchestrator  (lib/agents/orchestrator.ts)
        │
        ├── [1] Risk Detector Agent          (lib/agents/riskDetectorAgent.ts)
        │         • Risk scoring (0–100)
        │         • Severity analysis (low / medium / high / critical)
        │         • Risky clause extraction & categorization
        │         • Obligations, liabilities, privacy, recommendations
        │         • Document type detection
        │         ↓ RiskDetectorOutput (FATAL if fails)
        │
        ├── [2] Legal Simplifier Agent       (lib/agents/legalSimplifierAgent.ts)
        │         • Executive summary (polished plain-English)
        │         • Per-clause plain-English explanations
        │         • User action advice per clause
        │         • One-sentence TLDR
        │         • Key actions the user should take
        │         ↓ LegalSimplifierOutput (non-fatal, graceful fallback)
        │
        └── [3] Negotiation Recommender      (lib/agents/negotiationAgent.ts)
                  • Overall negotiation strategy
                  • Per-clause negotiation guidance
                  • Business impact reasoning
                  • Suggested alternative contract wording
                  • Quick wins (easy asks)
                  • Walk-away triggers
                  • Leverage assessment
                  ↓ NegotiationRecommenderOutput (non-fatal, graceful fallback)
                        │
                        ▼
               Merged OrchestratorResult → API Response
```

## Files

| File | Purpose |
|---|---|
| `lib/agents/types.ts` | Shared agent I/O types + orchestrator result shape |
| `lib/agents/logger.ts` | Lightweight structured logger (no deps) |
| `lib/agents/riskDetectorAgent.ts` | Agent 1: Risk Detector |
| `lib/agents/legalSimplifierAgent.ts` | Agent 2: Legal Simplifier |
| `lib/agents/negotiationAgent.ts` | Agent 3: Negotiation Recommender |
| `lib/agents/orchestrator.ts` | Central pipeline coordinator |
| `lib/agents/index.ts` | Barrel export |

## Frontend Display

| Component | Displays |
|---|---|
| `OverallRiskBanner` | Risk Detector output |
| `RiskyClausesPanel` | Risk Detector clauses |
| `RecommendationsSection` | Risk Detector recommendations |
| `NegotiationSection` | **Negotiation Recommender output** — strategy, per-clause guidance, quick wins, walk-away triggers |
| `PlainEnglishSection` | Legal Simplifier executive summary |

## PDF Report

The PDF report (`lib/report/buildRiskReportHtml.ts`) now includes:
- Executive summary (from Legal Simplifier)
- Negotiation Guidance section (from Negotiation Recommender):
  - Overall strategy & leverage rating
  - Priority focus sentence
  - Quick wins
  - Per-clause recommendations with business impact
  - Suggested alternative wording (where applicable)
  - Walk-away triggers

## Agent Failure Handling

| Agent | Failure mode |
|---|---|
| Risk Detector | **Fatal** — pipeline aborts, error returned to user |
| Legal Simplifier | Non-fatal — graceful fallback (uses raw summary + basic clause labels) |
| Negotiation Recommender | Non-fatal — graceful fallback (builds basic recs from clause data) |

## Adding a New Agent

1. Create `lib/agents/<name>Agent.ts` implementing:
   - Input/Output types in `lib/agents/types.ts`
   - Its own system prompt
   - Its own Gemini JSON schema
   - Its own Zod validation schema
   - `runXxxAgent(input, ctx)` export returning `AgentResult<XxxOutput>`
2. Call it in `orchestrator.ts` after step 3
3. Update `lib/types.ts` (AnalysisResult) with optional enrichment fields
4. Add display component in `app/components/`
5. Update `lib/report/buildRiskReportHtml.ts` for PDF inclusion
6. Export from `lib/agents/index.ts`

## Planned Future Agents

- Compliance Checker Agent
- Jurisdiction Analyzer Agent
