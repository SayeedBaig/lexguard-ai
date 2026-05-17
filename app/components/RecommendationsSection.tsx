"use client";

import type { Recommendation } from "@/lib/types";
import { riskConfig } from "@/lib/riskStyles";

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  visible: boolean;
}

export function RecommendationsSection({
  recommendations,
  visible,
}: RecommendationsSectionProps) {
  if (!visible || recommendations.length === 0) return null;

  return (
    <section
      className="card animate-fade-in-up rounded-xl border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-6 sm:p-8"
      aria-labelledby="recommendations-heading"
    >
      <header className="mb-6">
        <p className="section-label">Next steps</p>
        <h2
          id="recommendations-heading"
          className="mt-1 text-lg font-semibold text-slate-900"
        >
          Recommendations for you
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Practical actions before you sign or negotiate
        </p>
      </header>

      <ol className="space-y-4">
        {recommendations.map((rec, index) => {
          const cfg = riskConfig[rec.priority];
          return (
            <li
              key={rec.id}
              className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-slate-900">{rec.title}</h3>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.border} ${cfg.bg} ${cfg.color}`}
                  >
                    {cfg.label} priority
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  {rec.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
