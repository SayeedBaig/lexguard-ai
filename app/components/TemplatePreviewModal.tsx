"use client";

import { useRouter } from "next/navigation";
import type { ContractTemplate } from "@/lib/templates";
import { TEMPLATE_STORAGE_KEY, TEMPLATE_TITLE_KEY } from "@/lib/templates";
import { riskConfig } from "@/lib/riskStyles";
import { RiskBadge } from "./results/RiskBadge";

interface TemplatePreviewModalProps {
  template: ContractTemplate | null;
  onClose: () => void;
}

export function TemplatePreviewModal({
  template,
  onClose,
}: TemplatePreviewModalProps) {
  const router = useRouter();

  if (!template) return null;

  const cfg = riskConfig[template.typicalRisk];

  const handleUseTemplate = () => {
    sessionStorage.setItem(TEMPLATE_STORAGE_KEY, template.body);
    sessionStorage.setItem(TEMPLATE_TITLE_KEY, template.title);
    onClose();
    router.push("/");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-preview-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Close preview"
        onClick={onClose}
      />

      <div className="card card-elevated relative flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-2xl">
        <div className={`border-b px-6 py-5 ${cfg.bg} ${cfg.border}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Template preview</p>
              <h2
                id="template-preview-title"
                className="mt-1 text-xl font-semibold text-slate-900"
              >
                {template.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{template.description}</p>
            </div>
            <RiskBadge level={template.typicalRisk} size="md" showRiskLabel showDot />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Sample clauses (for analysis demo)
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700">
            {template.body}
          </pre>
          <p className="mt-4 text-xs text-slate-500">
            Not legal advice. Customize all templates with qualified counsel before
            use.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button type="button" onClick={handleUseTemplate} className="btn-primary">
            Use in analyzer
          </button>
        </div>
      </div>
    </div>
  );
}
