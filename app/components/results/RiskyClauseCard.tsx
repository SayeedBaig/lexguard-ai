"use client";

import type { RiskyClause } from "@/lib/types";
import { riskConfig } from "@/lib/riskStyles";
import { AlertIcon } from "../icons";
import { RiskBadge } from "./RiskBadge";

interface RiskyClauseCardProps {
  clause: RiskyClause;
  index: number;
}

export function RiskyClauseCard({ clause, index }: RiskyClauseCardProps) {
  const cfg = riskConfig[clause.severity];
  const styles = cfg.clause;

  return (
    <li
      className={`relative overflow-hidden rounded-xl border p-5 shadow-sm transition hover:shadow-md sm:p-6 ${styles.card}`}
      style={{ animationDelay: `${index * 50}ms` }}
      aria-label={`${clause.title}, ${cfg.riskLabel}`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${cfg.bar}`}
        aria-hidden
      />

      <div className="flex flex-col gap-4 pl-2 sm:pl-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-snug text-slate-900">
                {clause.title}
              </h3>
              {clause.lineRef && (
                <span className="rounded-md bg-white/80 px-2 py-0.5 font-mono text-xs text-slate-500 ring-1 ring-slate-200/80">
                  {clause.lineRef}
                </span>
              )}
            </div>
            <span
              className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles.category}`}
            >
              {clause.category}
            </span>
          </div>
          <RiskBadge
            level={clause.severity}
            size="md"
            showDot
            showRiskLabel
            className="shrink-0 self-start"
          />
        </div>

        <div
          className={`rounded-lg border px-4 py-3.5 ${styles.excerpt}`}
        >
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Contract text
          </p>
          <blockquote className="font-mono text-xs leading-relaxed text-slate-700 sm:text-[0.8125rem]">
            {clause.excerpt}
          </blockquote>
        </div>

        <div
          className={`flex gap-3 rounded-lg border px-4 py-3.5 ${styles.explanation}`}
        >
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.iconBg}`}
            aria-hidden
          >
            <AlertIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Why this matters
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {clause.explanation}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}
