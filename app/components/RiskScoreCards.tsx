"use client";

import type { AnalysisResult, RiskLevel } from "@/lib/types";
import { riskConfig } from "@/lib/riskStyles";

interface RiskScoreCardsProps {
  scores: AnalysisResult["riskScores"];
  overallRisk: RiskLevel;
  visible: boolean;
}

const levels: RiskLevel[] = ["low", "medium", "high", "critical"];

export function RiskScoreCards({
  scores,
  overallRisk,
  visible,
}: RiskScoreCardsProps) {
  const total = scores.low + scores.medium + scores.high + (scores.critical || 0);

  return (
    <div
      className={`grid gap-4 transition-opacity duration-500 sm:grid-cols-2 lg:grid-cols-4 ${
        visible ? "opacity-100" : "opacity-50"
      }`}
      role="group"
      aria-label="Severity breakdown"
    >
      {levels.map((level) => {
        const cfg = riskConfig[level];
        const count = scores[level];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isOverall = level === overallRisk;

        return (
          <article
            key={level}
            className={`relative overflow-hidden rounded-xl border bg-white p-5 transition-shadow ${
              isOverall
                ? `ring-2 ${cfg.border} shadow-md`
                : "border-slate-200 hover:shadow-md"
            }`}
            aria-label={`${cfg.label} severity: ${count} items`}
          >
            {isOverall && (
              <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 shadow-sm ring-1 ring-blue-100">
                Primary
              </span>
            )}

            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}
                aria-hidden
              >
                <SeverityBars level={level} barClass={cfg.bar} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {cfg.label}
                </p>
                <p
                  className={`text-3xl font-bold tabular-nums tracking-tight ${cfg.color}`}
                >
                  {count}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Share of flags</span>
                <span className={`font-semibold tabular-nums ${cfg.color}`}>
                  {pct}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.bar}`}
                  style={{ width: visible ? `${pct}%` : "0%" }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${pct}% of flagged provisions`}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SeverityBars({
  level,
  barClass,
}: {
  level: RiskLevel;
  barClass: string;
}) {
  const heights =
    level === "low" ? [35, 50, 30] : level === "medium" ? [50, 70, 45] : level === "high" ? [65, 90, 55] : [80, 100, 75];

  return (
    <div className="flex h-7 items-end gap-1">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-sm ${barClass}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
