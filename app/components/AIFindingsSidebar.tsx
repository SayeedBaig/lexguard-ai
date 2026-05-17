"use client";

import type {
  AIFinding,
  AnalysisResult,
  Recommendation,
  RiskLevel,
} from "@/lib/types";
import { riskConfig } from "@/lib/riskStyles";
import { SparklesIcon } from "./icons";

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
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white"
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
          <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4">
            <Stat label="Word count" value={result.wordCount.toLocaleString()} />
            <Stat
              label="Overall risk"
              value={riskConfig[result.overallRisk].label}
              valueClass={riskConfig[result.overallRisk].color}
            />
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
                  className="rounded-md border border-blue-100 bg-white px-3 py-2 text-xs text-slate-700"
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
                Run an analysis to surface AI-detected issues, fairness gaps,
                and negotiation recommendations.
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
      <p className={`mt-0.5 text-sm font-semibold ${valueClass}`}>{value}</p>
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
  const cfg = riskConfig[finding.severity];

  return (
    <li
      className="animate-fade-in-up rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          {finding.tag}
        </span>
        <span className="text-xs font-semibold text-blue-600">
          {finding.confidence}% confidence
        </span>
      </div>
      <h3 className="text-sm font-medium text-slate-900">{finding.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
        {finding.description}
      </p>
      <SeverityPill severity={finding.severity} />
    </li>
  );
}

function SeverityPill({ severity }: { severity: RiskLevel }) {
  const cfg = riskConfig[severity];
  return (
    <span
      className={`mt-3 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${cfg.border} ${cfg.bg} ${cfg.color}`}
    >
      {cfg.label} priority
    </span>
  );
}
