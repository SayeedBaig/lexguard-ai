"use client";

import { FileIcon, SparklesIcon } from "./icons";
import { ResultSection } from "./results/ResultSection";
import { SectionHeader } from "./results/SectionHeader";

interface PlainEnglishSectionProps {
  summary: string;
  visible: boolean;
}

export function PlainEnglishSection({
  summary,
  visible,
}: PlainEnglishSectionProps) {
  if (!visible || !summary.trim()) return null;

  return (
    <ResultSection id="summary">
      <SectionHeader
        label="Plain language"
        title="What this contract means"
        description="AI-generated overview for non-specialist readers"
        icon={<FileIcon className="h-5 w-5" />}
        iconClassName="bg-slate-100 text-slate-600"
      />

      <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-slate-50 p-6 sm:p-7">
        <SparklesIcon
          className="pointer-events-none absolute right-4 top-4 h-8 w-8 text-blue-200"
          aria-hidden
        />
        <p className="relative max-w-prose text-sm leading-[1.8] text-slate-700 sm:text-[0.9375rem]">
          {summary}
        </p>
      </div>
    </ResultSection>
  );
}
