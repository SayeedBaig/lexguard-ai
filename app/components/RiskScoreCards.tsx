"use client";

import type { AnalysisResult, RiskLevel } from "@/lib/types";
import { riskConfig } from "@/lib/riskStyles";

interface RiskScoreCardsProps {
  scores: AnalysisResult["riskScores"];
  overallRisk: RiskLevel;
  visible: boolean;
}

const levels: RiskLevel[] = ["low", "medium", "high"];

export function RiskScoreCards({
  scores,
  overallRisk,
  visible,
}: RiskScoreCardsProps) {
  const total = scores.low + scores.medium + scores.high;

  return (
    <div
      className={`grid gap-4 transition-opacity duration-500 sm:grid-cols-3 ${
        visible ? "opacity-100" : "opacity-50"
      }`}
      role="group"
      aria-label="Risk score summary"
    >
      {levels.map((level) => {
        const cfg = riskConfig[level];
        const count = scores[level];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isOverall = level === overallRisk;

        return (
          <article
            key={level}
            className={`card rounded-xl p-5 transition-shadow ${
              isOverall ? "card-highlight ring-2 ring-blue-200" : "hover:shadow-md"
            }`}
            aria-label={`${cfg.label} risk: ${count} items`}
          >
            {isOverall && (
              <span className="mb-3 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                Primary risk level
              </span>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {cfg.label} risk
                </p>
                <p
                  className={`mt-1 text-3xl font-semibold tabular-nums tracking-tight ${cfg.color}`}
                >
                  {count}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${cfg.iconBg}`}
                aria-hidden
              >
                <RiskBar level={level} barClass={cfg.bar} />
              </div>
            </div>
            <div className="mt-5">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                  style={{ width: visible ? `${pct}%` : "0%" }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${pct}% of flagged items`}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {pct}% of flagged provisions
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function RiskBar({ level, barClass }: { level: RiskLevel; barClass: string }) {
  const heights =
    level === "low" ? [40, 55, 35] : level === "medium" ? [55, 70, 50] : [70, 90, 65];

  return (
    <div className="flex h-7 items-end gap-0.5">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-1 rounded-sm ${barClass} opacity-90`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
