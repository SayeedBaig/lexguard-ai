"use client";

import { useCallback, useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { generatePdfReport } from "@/lib/report/downloadPdfReport";
import { PrintIcon, DownloadIcon } from "./icons";

interface DownloadReportButtonProps {
  result: AnalysisResult;
  contractLabel?: string | null;
}

export function DownloadReportButton({
  result,
  contractLabel,
}: DownloadReportButtonProps) {
  const [status, setStatus] = useState<"idle" | "downloaded">("idle");
  const label = contractLabel?.trim() || undefined;

  const handleDownload = useCallback(() => {
    generatePdfReport(result, label);
    setStatus("downloaded");
    window.setTimeout(() => setStatus("idle"), 3000);
  }, [result, label]);

  return (
    <div className="card rounded-xl border-blue-100 bg-gradient-to-r from-blue-50/60 to-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-label">Export</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            Download risk report
          </h3>
          <p className="mt-1 max-w-md text-sm text-slate-600">
            Save a professional PDF report with scores, clauses, and
            recommendations.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleDownload}
            className="btn-primary min-w-[160px]"
          >
            <DownloadIcon className="h-4 w-4 shrink-0" aria-hidden />
            {status === "downloaded" ? "Downloaded!" : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
