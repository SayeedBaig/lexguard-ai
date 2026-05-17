"use client";

import type { RiskLevel, RiskyClause } from "@/lib/types";
import { riskConfig } from "@/lib/riskStyles";
import { DocumentAlertIcon } from "./icons";
import { ResultSection } from "./results/ResultSection";
import { RiskyClauseCard } from "./results/RiskyClauseCard";
import { SectionHeader } from "./results/SectionHeader";

interface RiskyClausesPanelProps {
  clauses: RiskyClause[];
  visible: boolean;
}

const severityOrder: RiskLevel[] = ["high", "medium", "low"];

export function RiskyClausesPanel({ clauses, visible }: RiskyClausesPanelProps) {
  if (!visible) return null;

  const counts = severityOrder.reduce(
    (acc, level) => {
      acc[level] = clauses.filter((c) => c.severity === level).length;
      return acc;
    },
    {} as Record<RiskLevel, number>,
  );

  const sorted = [...clauses].sort(
    (a, b) =>
      severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  );

  return (
    <ResultSection id="risky-clauses" empty={clauses.length === 0}>
      <SectionHeader
        label="Contract review"
        title="Risky clauses"
        description="Provisions flagged by severity — review before signing"
        count={clauses.length}
        icon={<DocumentAlertIcon className="h-5 w-5" />}
        iconClassName="bg-red-50 text-red-600"
      />

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="list"
        aria-label="Clause severity summary"
      >
        {severityOrder.map((level) => {
          const cfg = riskConfig[level];
          const count = counts[level];
          if (count === 0) return null;

          return (
            <span
              key={level}
              role="listitem"
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${cfg.border} ${cfg.bg} ${cfg.color}`}
            >
              <span className={`h-2 w-2 rounded-full ${cfg.bar}`} aria-hidden />
              {cfg.riskLabel}: {count}
            </span>
          );
        })}
      </div>

      <ul className="space-y-5">
        {sorted.map((clause, index) => (
          <RiskyClauseCard key={clause.id} clause={clause} index={index} />
        ))}
      </ul>
    </ResultSection>
  );
}
