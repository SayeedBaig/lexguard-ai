"use client";

import type { AnalysisResult } from "@/lib/types";
import { OverallRiskBanner } from "./OverallRiskBanner";
import { RiskScoreCards } from "./RiskScoreCards";
import { RecommendationsSection } from "./RecommendationsSection";
import { NegotiationSection } from "./NegotiationSection";
import { RiskyClausesPanel } from "./RiskyClausesPanel";
import { PrivacyConcernsSection } from "./PrivacyConcernsSection";
import { PlainEnglishSection } from "./PlainEnglishSection";
import { ObligationsSection } from "./ObligationsSection";
import { LiabilitiesSection } from "./LiabilitiesSection";
import { DownloadReportButton } from "./DownloadReportButton";
import { ContractCategoryCard } from "./ContractCategoryCard";
import { HighlightedContract } from "./HighlightedContract";


interface AnalysisResultsProps {
  result: AnalysisResult;
  visible: boolean;
  isAnalyzing: boolean;
  contractText: string;
  contractLabel?: string | null;
}

export function AnalysisResults({
  result,
  visible,
  isAnalyzing,
  contractText,
  contractLabel,
}: AnalysisResultsProps) {
  if (!visible) return null;

  const obligations = result.obligations ?? [];
  const hasTerms = obligations.length > 0;

  return (
    <section
      aria-labelledby="analysis-results-heading"
      className="space-y-8"
    >
      <h2 id="analysis-results-heading" className="sr-only">
        Contract analysis results
      </h2>

      <ContractCategoryCard result={result} />

      <OverallRiskBanner result={result} />

      <DownloadReportButton result={result} contractLabel={contractLabel} />

      <div>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Severity breakdown
        </h3>
        <RiskScoreCards
          scores={result.riskScores}
          overallRisk={result.overallRisk}
          visible={!isAnalyzing}
        />
      </div>

      <RecommendationsSection
        recommendations={result.recommendations}
        visible
      />

      {/* Agent 3: Negotiation Recommender output */}
      <NegotiationSection result={result} visible />

      <HighlightedContract contractText={contractText} result={result} />

      <RiskyClausesPanel clauses={result.riskyClauses} visible />

      {hasTerms && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ObligationsSection items={obligations} visible />
          <LiabilitiesSection items={obligations} visible />
        </div>
      )}

      <PrivacyConcernsSection concerns={result.privacyConcerns} visible />

      <PlainEnglishSection summary={result.plainEnglish} visible />
    </section>
  );
}
