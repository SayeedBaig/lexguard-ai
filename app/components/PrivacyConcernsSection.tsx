"use client";

import type { PrivacyConcern } from "@/lib/types";
import { riskConfig } from "@/lib/riskStyles";

interface PrivacyConcernsSectionProps {
  concerns: PrivacyConcern[];
  visible: boolean;
}

export function PrivacyConcernsSection({
  concerns,
  visible,
}: PrivacyConcernsSectionProps) {
  if (!visible || concerns.length === 0) return null;

  return (
    <section
      className="card card-elevated animate-fade-in-up rounded-xl p-6 sm:p-8"
      aria-labelledby="privacy-heading"
    >
      <header className="mb-6">
        <p className="section-label">Data & privacy</p>
        <h2
          id="privacy-heading"
          className="mt-1 text-lg font-semibold text-slate-900"
        >
          Privacy & data concerns
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          How your data may be collected, used, or shared under this agreement
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {concerns.map((concern) => {
          const cfg = riskConfig[concern.severity];
          return (
            <li
              key={concern.id}
              className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-medium text-slate-900">{concern.title}</h3>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.border} ${cfg.bg} ${cfg.color}`}
                >
                  {cfg.label}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {concern.description}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
