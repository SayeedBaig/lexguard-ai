"use client";

import type { ContractTemplate } from "@/lib/templates";
import { riskConfig } from "@/lib/riskStyles";
import { EyeIcon } from "./icons";
import { RiskBadge } from "./results/RiskBadge";

interface TemplateCardProps {
  template: ContractTemplate;
  onPreview: (template: ContractTemplate) => void;
}

export function TemplateCard({ template, onPreview }: TemplateCardProps) {
  const cfg = riskConfig[template.typicalRisk];

  return (
    <article
      className={`card flex h-full flex-col rounded-xl p-6 transition hover:shadow-md ${cfg.highlight}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${cfg.border} ${cfg.bg} ${cfg.color}`}
        >
          {template.category}
        </span>
        <RiskBadge
          level={template.typicalRisk}
          size="sm"
          showRiskLabel
          showDot
        />
      </div>

      <h3 className="text-lg font-semibold text-slate-900">{template.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
        {template.description}
      </p>

      <p className="mt-4 line-clamp-2 font-mono text-xs leading-relaxed text-slate-500">
        {template.preview}
      </p>

      <button
        type="button"
        onClick={() => onPreview(template)}
        className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
      >
        <EyeIcon className="h-4 w-4 shrink-0" aria-hidden />
        Quick preview
      </button>
    </article>
  );
}
