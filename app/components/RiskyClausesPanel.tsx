"use client";

import type { RiskyClause } from "@/lib/types";
import { riskConfig } from "@/lib/riskStyles";
import { AlertIcon } from "./icons";

interface RiskyClausesPanelProps {
  clauses: RiskyClause[];
  visible: boolean;
}

export function RiskyClausesPanel({ clauses, visible }: RiskyClausesPanelProps) {
  if (!visible) return null;

  return (
    <section
      className="card card-elevated animate-fade-in-up rounded-xl p-6 sm:p-8"
      aria-labelledby="risky-clauses-heading"
    >
      <header className="mb-6 flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"
          aria-hidden
        >
          <AlertIcon className="h-5 w-5" />
        </div>
        <div>
          <h2
            id="risky-clauses-heading"
            className="text-lg font-semibold text-slate-900"
          >
            Flagged provisions
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {clauses.length} clause{clauses.length !== 1 ? "s" : ""} identified
            for legal review
          </p>
        </div>
      </header>

      <ul className="space-y-4">
        {clauses.map((clause) => {
          const cfg = riskConfig[clause.severity];
          return (
            <li
              key={clause.id}
              className="rounded-lg border border-slate-200 bg-slate-50/50 p-5 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-slate-900">{clause.title}</h3>
                    {clause.lineRef && (
                      <span className="font-mono text-xs text-slate-500">
                        {clause.lineRef}
                      </span>
                    )}
                  </div>
                  <span className="mt-2 inline-block rounded bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                    {clause.category}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.border} ${cfg.bg} ${cfg.color}`}
                >
                  {cfg.label}
                </span>
              </div>
              <blockquote className="mt-4 border-l-[3px] border-red-300 bg-white py-2 pl-4 font-mono text-xs leading-relaxed text-slate-600">
                {clause.excerpt}
              </blockquote>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
