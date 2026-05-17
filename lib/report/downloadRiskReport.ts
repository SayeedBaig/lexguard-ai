import type { AnalysisResult } from "../types";
import { buildRiskReportHtml } from "./buildRiskReportHtml";

function reportBaseName(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `lexguard-risk-report-${date}`;
}

/** Download a self-contained HTML report (open in browser, print to PDF). */
export function downloadRiskReportHtml(
  result: AnalysisResult,
  contractLabel?: string,
): void {
  const html = buildRiskReportHtml(result, { contractLabel });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reportBaseName()}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Open a print-ready report (use Print → Save as PDF in the browser). */
export function printRiskReport(
  result: AnalysisResult,
  contractLabel?: string,
): void {
  const html = buildRiskReportHtml(result, { contractLabel });
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    window.alert(
      "Pop-up blocked. Please allow pop-ups for this site, or use Download Report instead.",
    );
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
