"use client";

import type { AnalysisResult } from "@/lib/types";
import {
  computeOverallRiskScore,
  riskScoreLabel,
} from "@/lib/computeRiskScore";
import { riskConfig } from "@/lib/riskStyles";
import { RiskBadge } from "./results/RiskBadge";
import { ChartIcon, SparklesIcon } from "./icons";

interface OverallRiskBannerProps {
  result: AnalysisResult;
}

export function OverallRiskBanner({ result }: OverallRiskBannerProps) {
  const score = computeOverallRiskScore(result.riskScores, result.overallRisk);
  const cfg = riskConfig[result.overallRisk];
  const descriptor = riskScoreLabel(score);
  const total =
    result.riskScores.low +
    result.riskScores.medium +
    result.riskScores.high;

  return (
    <section
      className="card card-elevated overflow-hidden rounded-xl border-slate-200"
      aria-labelledby="overall-risk-heading"
    >
      <div
        className={`border-b px-6 py-5 sm:px-8 ${cfg.bg} ${cfg.border} border-b`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${cfg.iconBg}`}
              aria-hidden
            >
              <ChartIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="section-label">Risk assessment</p>
              <h2
                id="overall-risk-heading"
                className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
              >
                Overall contract risk
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {descriptor} exposure based on {total} flagged provision
                {total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div
              className={`flex min-w-[7.5rem] flex-col items-center rounded-2xl border px-6 py-4 shadow-sm ${cfg.border} bg-white`}
            >
              <span
                className={`text-4xl font-bold tabular-nums tracking-tight ${cfg.color}`}
              >
                {score}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Risk score
              </span>
            </div>
            <RiskBadge level={result.overallRisk} size="lg" showDot />
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
        {(["low", "medium", "high"] as const).map((level) => {
          const levelCfg = riskConfig[level];
          const count = result.riskScores[level];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div
              key={level}
              className="flex items-center gap-4 bg-white px-6 py-4 sm:px-8"
            >
              <div
                className={`h-10 w-1 shrink-0 rounded-full ${levelCfg.bar}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${levelCfg.color}`}
                >
                  {levelCfg.label}
                </p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">
                  {count}
                </p>
                <p className="text-xs text-slate-500">{pct}% of flags</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-3 sm:px-8">
        <p className="text-xs text-slate-500">
          Analyzed {new Date(result.analyzedAt).toLocaleString()} ·{" "}
          {result.wordCount.toLocaleString()} words
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          <SparklesIcon className="h-3.5 w-3.5" aria-hidden />
          Gemini AI
        </span>
      </div>
    </section>
  );
}
