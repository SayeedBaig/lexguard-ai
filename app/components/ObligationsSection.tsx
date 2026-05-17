"use client";

import type { ReactNode } from "react";
import type { ObligationItem } from "@/lib/types";
import { ClipboardIcon } from "./icons";
import { ResultSection } from "./results/ResultSection";
import { SectionHeader } from "./results/SectionHeader";

interface ObligationsSectionProps {
  items: ObligationItem[];
  visible: boolean;
}

export function ObligationsSection({
  items,
  visible,
}: ObligationsSectionProps) {
  const obligations = items.filter((i) => i.kind === "obligation");
  if (!visible) return null;

  return (
    <ResultSection id="obligations" empty={obligations.length === 0}>
      <SectionHeader
        label="Duties"
        title="Obligations"
        description="Contractual duties each party must perform"
        count={obligations.length}
        icon={<ClipboardIcon className="h-5 w-5" />}
        iconClassName="bg-blue-50 text-blue-600"
      />
      <ul className="space-y-3">
        {obligations.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
          >
            {item.party && (
              <span className="mb-2 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-800 ring-1 ring-blue-100">
                {item.party}
              </span>
            )}
            <p className="text-sm leading-relaxed text-slate-700">
              {highlightKeywords(item.text)}
            </p>
          </li>
        ))}
      </ul>
    </ResultSection>
  );
}

function highlightKeywords(text: string): ReactNode {
  const keywords = ["shall", "must", "notify", "security", "maintain", "provide"];
  const pattern = new RegExp(`(${keywords.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isMatch = keywords.some((k) => k.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      return (
        <mark
          key={i}
          className="rounded bg-blue-100/80 px-0.5 font-medium text-blue-900"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}
