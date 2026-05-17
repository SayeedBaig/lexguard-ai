"use client";

import { useState } from "react";
import { CONTRACT_TEMPLATES } from "@/lib/templates";
import type { ContractTemplate } from "@/lib/templates";
import { AppShell } from "./AppShell";
import { TemplateCard } from "./TemplateCard";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { DocumentTypeIcon } from "./icons";

export function TemplatesView() {
  const [previewTemplate, setPreviewTemplate] =
    useState<ContractTemplate | null>(null);

  return (
    <AppShell>
      <main
        id="main-content"
        className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      >
        <div className="mb-10 border-b border-slate-200 pb-8">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"
              aria-hidden
            >
              <DocumentTypeIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="section-label">Contract library</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Templates
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
                Start from common agreement types, preview sample language, then
                run AI risk analysis on the Dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {CONTRACT_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={setPreviewTemplate}
            />
          ))}
        </div>
      </main>

      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </AppShell>
  );
}
