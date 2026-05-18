"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { fetchContractAnalysis } from "@/lib/analyzeClient";
import { TEMPLATE_STORAGE_KEY } from "@/lib/templates";
import { AIFindingsSidebar } from "./AIFindingsSidebar";
import { AnalysisErrorBanner } from "./AnalysisErrorBanner";
import { AnalysisResults } from "./AnalysisResults";
import { AppShell } from "./AppShell";
import { ContractInput } from "./ContractInput";
import { LoadingOverlay } from "./LoadingOverlay";
import { saveHistoryItem, RESTORE_HISTORY_KEY, HistoryItem } from "@/lib/history";
import { useAuth } from "../context/AuthContext";

const DEMO_TEXT = `MASTER SERVICES AGREEMENT

8.2 Limitation of Liability. Party shall be liable for any and all damages, including indirect, consequential, and punitive damages, without limitation.

3.1 Term. This Agreement shall automatically renew for successive twelve (12) month terms unless terminated in writing at least ninety (90) days prior to the end of the then-current term.

9.4 Indemnification. Customer shall indemnify, defend, and hold harmless Provider from any claims arising out of Customer's use of the Services.

5.3 Data. Provider may process Customer Data for product improvement, analytics, and machine learning model training.`;

export function Dashboard() {
  const { token } = useAuth();
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
      const analysis = await fetchContractAnalysis(text, token);
      setResult(analysis);
      setHasAnalyzed(true);
      
      saveHistoryItem({
        contractText: text,
        fileName: fileName,
        result: analysis,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Analysis failed. Please try again.",
      );
      setHasAnalyzed(false);
    } finally {
      setIsAnalyzing(false);
    }
  }, [contractText, fileName]);

  const loadDemo = () => {
    setContractText(DEMO_TEXT);
    setFileName(null);
    setError(null);
  };

  useEffect(() => {
    const stored = sessionStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (stored) {
      setContractText(stored);
      setFileName("Template");
      sessionStorage.removeItem(TEMPLATE_STORAGE_KEY);
      return;
    }

    const restoreHistoryStr = sessionStorage.getItem(RESTORE_HISTORY_KEY);
    if (restoreHistoryStr) {
      try {
        const item = JSON.parse(restoreHistoryStr) as HistoryItem;
        setContractText(item.contractText);
        setFileName(item.fileName);
        setResult(item.result);
        setHasAnalyzed(true);
      } catch (err) {
        console.error("Failed to restore history", err);
      }
      sessionStorage.removeItem(RESTORE_HISTORY_KEY);
    }
  }, []);

  return (
    <AppShell>
      {isAnalyzing && <LoadingOverlay />}

      <main
        id="main-content"
        className="relative flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
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
          <div className="space-y-8">
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
              token={token}
            />

            {result && (
              <AnalysisResults
                result={result}
                visible={hasAnalyzed}
                isAnalyzing={isAnalyzing}
                contractLabel={fileName}
              />
            )}
          </div>

          <AIFindingsSidebar
            findings={result?.findings ?? []}
            recommendations={result?.recommendations ?? []}
            result={result}
            visible={hasAnalyzed}
          />
        </div>
      </main>
    </AppShell>
  );
}
