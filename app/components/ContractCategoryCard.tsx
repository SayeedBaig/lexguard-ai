"use client";

import type { AnalysisResult } from "@/lib/types";
import { DocumentTypeIcon, SparklesIcon } from "./icons";

interface ContractCategoryCardProps {
  result: AnalysisResult;
}

export function ContractCategoryCard({ result }: ContractCategoryCardProps) {
  const { documentType, documentTypeConfidence } = result;
  const confidenceLabel =
    documentTypeConfidence >= 85
      ? "High confidence"
      : documentTypeConfidence >= 60
        ? "Moderate confidence"
        : "Review suggested";

  return (
    <section
      className="card card-elevated overflow-hidden rounded-xl border-indigo-100"
      aria-labelledby="document-type-heading"
    >
      <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/50 to-white px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm"
              aria-hidden
            >
              <DocumentTypeIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="section-label text-indigo-700">
                AI document classification
              </p>
              <h2
                id="document-type-heading"
                className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
              >
                {documentType}
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Automatically detected contract category
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-800 shadow-sm">
              <SparklesIcon className="h-3.5 w-3.5" aria-hidden />
              Gemini AI
            </span>
            <span
              className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold tabular-nums text-indigo-900"
              title={confidenceLabel}
            >
              {documentTypeConfidence}% match
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
