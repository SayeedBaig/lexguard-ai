"use client";

import type { ReactNode } from "react";
import type { ObligationItem } from "@/lib/types";
import { ScaleIcon } from "./icons";
import { ResultSection } from "./results/ResultSection";
import { SectionHeader } from "./results/SectionHeader";

interface LiabilitiesSectionProps {
  items: ObligationItem[];
  visible: boolean;
}

export function LiabilitiesSection({ items, visible }: LiabilitiesSectionProps) {
  const liabilities = items.filter((i) => i.kind === "liability");
  if (!visible) return null;

  return (
    <ResultSection id="liabilities" empty={liabilities.length === 0}>
      <SectionHeader
        label="Exposure"
        title="Liabilities"
        description="Financial and legal exposure assigned to each party"
        count={liabilities.length}
        icon={<ScaleIcon className="h-5 w-5" />}
        iconClassName="bg-amber-50 text-amber-700"
      />
      <TermList items={liabilities} accent="border-amber-200 bg-amber-50/30" />
    </ResultSection>
  );
}

function TermList({
  items,
  accent,
}: {
  items: ObligationItem[];
  accent: string;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className={`rounded-xl border p-4 transition hover:shadow-sm ${accent}`}
        >
          {item.party && <PartyBadge party={item.party} variant="liability" />}
          <p className="text-sm leading-relaxed text-slate-700">
            {highlightKeywords(item.text)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function PartyBadge({
  party,
  variant,
}: {
  party: string;
  variant: "obligation" | "liability";
}) {
  const styles =
    variant === "liability"
      ? "bg-amber-100 text-amber-900 ring-amber-200"
      : "bg-blue-50 text-blue-800 ring-blue-100";

  return (
    <span
      className={`mb-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles}`}
    >
      {party}
    </span>
  );
}

function highlightKeywords(text: string): ReactNode {
  const keywords = [
    "liable",
    "liability",
    "indemnify",
    "damages",
    "consequential",
    "punitive",
  ];
  const pattern = new RegExp(`(${keywords.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isMatch = keywords.some((k) => k.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      return (
        <mark
          key={i}
          className="rounded bg-amber-100/90 px-0.5 font-medium text-amber-900"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}
