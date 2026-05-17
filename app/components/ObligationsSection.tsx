"use client";

import type { ReactNode } from "react";
import type { ObligationItem } from "@/lib/types";

interface ObligationsSectionProps {
  items: ObligationItem[];
  visible: boolean;
}

export function ObligationsSection({
  items,
  visible,
}: ObligationsSectionProps) {
  if (!visible) return null;

  const obligations = items.filter((i) => i.kind === "obligation");
  const liabilities = items.filter((i) => i.kind === "liability");

  return (
    <section
      className="card card-elevated animate-fade-in-up rounded-xl p-6 sm:p-8"
      aria-labelledby="obligations-heading"
    >
      <header className="mb-6">
        <p className="section-label">Key terms</p>
        <h2
          id="obligations-heading"
          className="mt-1 text-lg font-semibold text-slate-900"
        >
          Obligations & liabilities
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Duties and exposure mapped for each party
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <ObligationGroup
          title="Obligations"
          accent="border-slate-200 bg-slate-50"
          badge="bg-blue-50 text-blue-800 ring-blue-100"
          items={obligations}
        />
        <ObligationGroup
          title="Liabilities"
          accent="border-amber-100 bg-amber-50/50"
          badge="bg-amber-50 text-amber-900 ring-amber-100"
          items={liabilities}
        />
      </div>
    </section>
  );
}

function ObligationGroup({
  title,
  accent,
  badge,
  items,
}: {
  title: string;
  accent: string;
  badge: string;
  items: ObligationItem[];
}) {
  return (
    <div className={`rounded-lg border p-5 ${accent}`}>
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-white/80 bg-white p-4 shadow-sm"
          >
            {item.party && (
              <span
                className={`mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${badge}`}
              >
                {item.party}
              </span>
            )}
            <p className="text-sm leading-relaxed text-slate-700">
              {highlightKeywords(item.text)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function highlightKeywords(text: string): ReactNode {
  const keywords = [
    "liable",
    "liability",
    "indemnify",
    "shall",
    "must",
    "notify",
    "security",
    "damages",
  ];
  const pattern = new RegExp(`(${keywords.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isMatch = keywords.some((k) => k.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      return (
        <mark
          key={i}
          className="rounded bg-amber-100 px-0.5 font-medium text-amber-900"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}
