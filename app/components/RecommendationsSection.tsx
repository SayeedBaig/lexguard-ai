"use client";

import type { Recommendation } from "@/lib/types";
import { ChecklistIcon } from "./icons";
import { RiskBadge } from "./results/RiskBadge";
import { ResultSection } from "./results/ResultSection";
import { SectionHeader } from "./results/SectionHeader";

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  visible: boolean;
}

export function RecommendationsSection({
  recommendations,
  visible,
}: RecommendationsSectionProps) {
  if (!visible) return null;

  return (
    <ResultSection
      id="recommendations"
      empty={recommendations.length === 0}
      className="border-blue-200/80 bg-gradient-to-br from-blue-50/40 via-white to-white"
    >
      <SectionHeader
        label="Next steps"
        title="Recommendations"
        description="Practical actions before you sign or negotiate"
        count={recommendations.length}
        icon={<ChecklistIcon className="h-5 w-5" />}
        iconClassName="bg-blue-600 text-white"
      />

      <ol className="space-y-4">
        {recommendations.map((rec, index) => (
          <li
            key={rec.id}
            className="flex gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-sm"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">{rec.title}</h3>
                <RiskBadge level={rec.priority} size="sm" showDot />
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {rec.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </ResultSection>
  );
}
