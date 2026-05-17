"use client";

interface PlainEnglishSectionProps {
  summary: string;
  visible: boolean;
}

export function PlainEnglishSection({
  summary,
  visible,
}: PlainEnglishSectionProps) {
  if (!visible) return null;

  return (
    <section
      className="card animate-fade-in-up rounded-xl p-6 sm:p-8"
      aria-labelledby="plain-english-heading"
    >
      <header className="mb-5">
        <p className="section-label">Plain language summary</p>
        <h2
          id="plain-english-heading"
          className="mt-1 text-lg font-semibold text-slate-900"
        >
          What this contract means
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          AI-generated overview written for non-specialist readers
        </p>
      </header>

      <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50/80 to-slate-50 p-6">
        <p className="text-sm leading-[1.75] text-slate-700">{summary}</p>
      </div>
    </section>
  );
}
