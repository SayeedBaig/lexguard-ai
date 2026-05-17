"use client";

import type { PrivacyConcern } from "@/lib/types";
import { LockIcon } from "./icons";
import { RiskBadge } from "./results/RiskBadge";
import { ResultSection } from "./results/ResultSection";
import { SectionHeader } from "./results/SectionHeader";

interface PrivacyConcernsSectionProps {
  concerns: PrivacyConcern[];
  visible: boolean;
}

export function PrivacyConcernsSection({
  concerns,
  visible,
}: PrivacyConcernsSectionProps) {
  if (!visible) return null;

  return (
    <ResultSection id="privacy" empty={concerns.length === 0}>
      <SectionHeader
        label="Data & privacy"
        title="Privacy concerns"
        description="How your data may be collected, used, or shared"
        count={concerns.length}
        icon={<LockIcon className="h-5 w-5" />}
        iconClassName="bg-violet-50 text-violet-700"
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        {concerns.map((concern) => (
          <li
            key={concern.id}
            className="flex h-full flex-col rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/40 to-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="font-semibold leading-snug text-slate-900">
                {concern.title}
              </h3>
              <RiskBadge level={concern.severity} size="sm" />
            </div>
            <p className="flex-1 text-sm leading-relaxed text-slate-600">
              {concern.description}
            </p>
          </li>
        ))}
      </ul>
    </ResultSection>
  );
}
