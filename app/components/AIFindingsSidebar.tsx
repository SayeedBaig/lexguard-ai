"use client";

import type {
  AIFinding,
  AnalysisResult,
  Recommendation,
} from "@/lib/types";
import { riskConfig } from "@/lib/riskStyles";
import { SparklesIcon } from "./icons";
import { RiskBadge } from "./results/RiskBadge";

interface AIFindingsSidebarProps {
  findings: AIFinding[];
  recommendations: Recommendation[];
  result: AnalysisResult | null;
  visible: boolean;
}

export function AIFindingsSidebar({
  findings,
  recommendations,
  result,
  visible,
}: AIFindingsSidebarProps) {
  const topRecommendations = recommendations.slice(0, 3);

  return (
    <aside
      className="lg:sticky lg:top-[4.75rem] lg:self-start"
      aria-label="AI findings"
    >
      <div className="card card-elevated overflow-hidden rounded-xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-slate-50 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm"
              aria-hidden
            >
              <SparklesIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">AI insights</h2>
              <p className="text-xs text-slate-500">Powered by Gemini</p>
            </div>
          </div>
        </div>

        {result && visible && (
          <div className="border-b border-slate-100 bg-indigo-50/40 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
              Document type
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {result.documentType}
            </p>
            <p className="mt-0.5 text-xs text-indigo-600">
              {result.documentTypeConfidence}% confidence
            </p>
          </div>
        )}

        {result && visible && result.riskCategories && result.riskCategories.length > 0 && (
          <div className="border-b border-slate-100 bg-purple-50/40 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-purple-800">
              Risk Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.riskCategories.map((cat, i) => (
                <span
                  key={i}
                  className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-purple-700 shadow-sm ring-1 ring-purple-200"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {result && visible && (
          <div className="border-b border-slate-100 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">
                Risk score
              </span>
              <RiskBadge level={result.overallRisk} size="sm" showDot />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="Score"
                value={String(result.riskScore ?? 0)}
                valueClass={riskConfig[result.overallRisk].color}
              />
              <Stat
                label="Conf."
                value={`${result.confidence ?? 0}%`}
              />
              <Stat
                label="Words"
                value={result.wordCount.toLocaleString()}
              />
            </div>
          </div>
        )}

        {visible && topRecommendations.length > 0 && (
          <div className="border-b border-slate-100 bg-blue-50/40 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-800">
              Top recommendations
            </h3>
            <ul className="space-y-2">
              {topRecommendations.map((rec) => (
                <li
                  key={rec.id}
                  className="rounded-lg border border-blue-100 bg-white px-3 py-2.5 text-xs"
                >
                  <span className="font-medium text-slate-900">{rec.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul className="max-h-[min(28rem,calc(100vh-16rem))] space-y-2 overflow-y-auto p-4">
          {visible && findings.length > 0 ? (
            findings.map((finding, i) => (
              <FindingCard key={finding.id} finding={finding} index={i} />
            ))
          ) : (
            <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <SparklesIcon
                className="mx-auto mb-3 h-8 w-8 text-slate-300"
                aria-hidden
              />
              <p className="text-sm font-medium text-slate-700">
                No insights yet
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Run an analysis to surface AI-detected issues and negotiation
                recommendations.
              </p>
            </li>
          )}
        </ul>

        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[11px] leading-relaxed text-slate-500">
            Not legal advice. LexGuard supports contract review — consult
            qualified counsel before signing.
          </p>
        </div>
      </div>
    </aside>
  );
}

function Stat({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function FindingCard({
  finding,
  index,
}: {
  finding: AIFinding;
  index: number;
}) {
  return (
    <li
      className="animate-fade-in-up rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          {finding.tag}
        </span>
        <span className="text-xs font-semibold tabular-nums text-blue-600">
          {finding.confidence}%
        </span>
      </div>
      <h3 className="text-sm font-medium text-slate-900">{finding.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
        {finding.description}
      </p>
      <div className="mt-3">
        <RiskBadge level={finding.severity} size="sm" showDot />
      </div>
    </li>
  );
}
