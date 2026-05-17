"use client";

import { useCallback, useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { fetchContractAnalysis } from "@/lib/analyzeClient";
import { riskConfig } from "@/lib/riskStyles";
import { AIFindingsSidebar } from "./AIFindingsSidebar";
import { AnalysisErrorBanner } from "./AnalysisErrorBanner";
import { ContractInput } from "./ContractInput";
import { LoadingOverlay } from "./LoadingOverlay";
import { Navbar } from "./Navbar";
import { ObligationsSection } from "./ObligationsSection";
import { PlainEnglishSection } from "./PlainEnglishSection";
import { PrivacyConcernsSection } from "./PrivacyConcernsSection";
import { RecommendationsSection } from "./RecommendationsSection";
import { RiskScoreCards } from "./RiskScoreCards";
import { RiskyClausesPanel } from "./RiskyClausesPanel";

const DEMO_TEXT = `MASTER SERVICES AGREEMENT

8.2 Limitation of Liability. Party shall be liable for any and all damages, including indirect, consequential, and punitive damages, without limitation.

3.1 Term. This Agreement shall automatically renew for successive twelve (12) month terms unless terminated in writing at least ninety (90) days prior to the end of the then-current term.

9.4 Indemnification. Customer shall indemnify, defend, and hold harmless Provider from any claims arising out of Customer's use of the Services.

5.3 Data. Provider may process Customer Data for product improvement, analytics, and machine learning model training.`;

export function Dashboard() {
  const [contractText, setContractText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    const text = contractText.trim();

    if (!text) {
      setError("Please paste or upload contract text before analyzing.");
      setHasAnalyzed(false);
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const analysis = await fetchContractAnalysis(text);
      setResult(analysis);
      setHasAnalyzed(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Analysis failed. Please try again.",
      );
      setHasAnalyzed(false);
    } finally {
      setIsAnalyzing(false);
    }
  }, [contractText]);

  const loadDemo = () => {
    setContractText(DEMO_TEXT);
    setFileName(null);
    setError(null);
  };

  const overallCfg = result ? riskConfig[result.overallRisk] : null;

  return (
    <div className="page-texture relative flex min-h-screen flex-col">
      {isAnalyzing && <LoadingOverlay />}

      <Navbar />

      <main
        id="main-content"
        className="relative mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      >
        <div className="mb-10 flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="section-label">Powered by Gemini AI</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Analyze agreements with confidence
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Upload or paste contracts to identify risky clauses, map
              obligations, and receive plain-language summaries in seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={loadDemo}
            className="btn-secondary shrink-0 self-start sm:self-auto"
          >
            Load sample contract
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            {error && (
              <AnalysisErrorBanner
                message={error}
                onDismiss={() => setError(null)}
              />
            )}

            <ContractInput
              value={contractText}
              onChange={setContractText}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              fileName={fileName}
              onFileNameChange={setFileName}
              hasContent={contractText.trim().length > 0}
            />

            {hasAnalyzed && result && (
              <section aria-labelledby="results-heading" className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h2
                    id="results-heading"
                    className="text-sm font-semibold text-slate-900"
                  >
                    Analysis results
                  </h2>
                  {overallCfg && (
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${overallCfg.border} ${overallCfg.bg} ${overallCfg.color}`}
                    >
                      Overall risk: {overallCfg.label}
                    </span>
                  )}
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Gemini AI
                  </span>
                </div>
                <RiskScoreCards
                  scores={result.riskScores}
                  overallRisk={result.overallRisk}
                  visible={hasAnalyzed && !isAnalyzing}
                />
              </section>
            )}

            <RecommendationsSection
              recommendations={result?.recommendations ?? []}
              visible={hasAnalyzed && !!result}
            />
            <RiskyClausesPanel
              clauses={result?.riskyClauses ?? []}
              visible={hasAnalyzed && !!result}
            />
            <PrivacyConcernsSection
              concerns={result?.privacyConcerns ?? []}
              visible={hasAnalyzed && !!result}
            />
            <PlainEnglishSection
              summary={result?.plainEnglish ?? ""}
              visible={hasAnalyzed && !!result}
            />
            <ObligationsSection
              items={result?.obligations ?? []}
              visible={hasAnalyzed && !!result}
            />
          </div>

          <AIFindingsSidebar
            findings={result?.findings ?? []}
            recommendations={result?.recommendations ?? []}
            result={result}
            visible={hasAnalyzed}
          />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <p className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} LexGuard · AI-assisted contract review —
          not legal advice. Consult qualified counsel before signing.
        </p>
      </footer>
    </div>
  );
}
