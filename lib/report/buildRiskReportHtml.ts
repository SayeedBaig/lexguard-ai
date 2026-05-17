import {
  computeOverallRiskScore,
  riskScoreLabel,
} from "../computeRiskScore";
import type { AnalysisResult, RiskLevel } from "../types";
import { escapeHtml } from "./escapeHtml";
import { reportRisk, reportStyles } from "./reportTheme";

export interface ReportOptions {
  contractLabel?: string;
}

function severityBadge(level: RiskLevel): string {
  const r = reportRisk[level];
  return `<span class="badge" style="color:${r.color};background:${r.bg};border-color:${r.border}">${escapeHtml(r.riskLabel)}</span>`;
}

function section(title: string, body: string): string {
  return `<h2 class="section">${escapeHtml(title)}</h2>${body}`;
}

function emptyNote(text: string): string {
  return `<p class="empty">${escapeHtml(text)}</p>`;
}

export function buildRiskReportHtml(
  result: AnalysisResult,
  options: ReportOptions = {},
): string {
  const score = computeOverallRiskScore(result.riskScores, result.overallRisk);
  const overall = reportRisk[result.overallRisk];
  const analyzed = new Date(result.analyzedAt).toLocaleString();
  const label = options.contractLabel?.trim() || "Contract analysis";
  const obligations = result.obligations.filter((o) => o.kind === "obligation");
  const liabilities = result.obligations.filter((o) => o.kind === "liability");

  const severitySummary = (["high", "medium", "low"] as RiskLevel[])
    .map((level) => {
      const count = result.riskScores[level];
      if (count === 0) return "";
      const r = reportRisk[level];
      return `<span class="severity-chip" style="color:${r.color}"><strong>${count}</strong> ${escapeHtml(r.label)}</span>`;
    })
    .join("");

  const clausesHtml =
    result.riskyClauses.length === 0
      ? emptyNote("No risky clauses flagged.")
      : result.riskyClauses
          .map((c) => {
            const r = reportRisk[c.severity];
            return `
        <div class="item" style="border-color:${r.border};background:${r.bg}22">
          <div class="item-header">
            <div>
              <span class="item-title">${escapeHtml(c.title)}</span>
              ${c.lineRef ? `<span class="item-ref">${escapeHtml(c.lineRef)}</span>` : ""}
              <p class="category">${escapeHtml(c.category)}</p>
            </div>
            ${severityBadge(c.severity)}
          </div>
          <div class="excerpt" style="border-left-color:${r.color}">${escapeHtml(c.excerpt)}</div>
          <p class="explanation"><strong>Why this matters:</strong> ${escapeHtml(c.explanation)}</p>
        </div>`;
          })
          .join("");

  const obligationsHtml =
    obligations.length === 0
      ? emptyNote("No obligations identified.")
      : obligations
          .map(
            (o) => `
        <div class="item">
          ${o.party ? `<p class="party">${escapeHtml(o.party)}</p>` : ""}
          <p class="body-text">${escapeHtml(o.text)}</p>
        </div>`,
          )
          .join("");

  const liabilitiesHtml =
    liabilities.length === 0
      ? emptyNote("No liabilities identified.")
      : liabilities
          .map(
            (l) => `
        <div class="item" style="background:#fffbeb22;border-color:#fcd34d">
          ${l.party ? `<p class="party" style="color:#b45309">${escapeHtml(l.party)}</p>` : ""}
          <p class="body-text">${escapeHtml(l.text)}</p>
        </div>`,
          )
          .join("");

  const privacyHtml =
    result.privacyConcerns.length === 0
      ? emptyNote("No privacy concerns identified.")
      : result.privacyConcerns
          .map(
            (p) => `
        <div class="item">
          <div class="item-header">
            <span class="item-title">${escapeHtml(p.title)}</span>
            ${severityBadge(p.severity)}
          </div>
          <p class="body-text">${escapeHtml(p.description)}</p>
        </div>`,
          )
          .join("");

  const recommendationsHtml =
    result.recommendations.length === 0
      ? emptyNote("No recommendations generated.")
      : result.recommendations
          .map(
            (rec, i) => `
        <div class="item">
          <div class="item-header">
            <span class="item-title"><span class="rec-num">${i + 1}</span>${escapeHtml(rec.title)}</span>
            ${severityBadge(rec.priority)}
          </div>
          <p class="body-text">${escapeHtml(rec.description)}</p>
        </div>`,
          )
          .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LexGuard Risk Report — ${escapeHtml(label)}</title>
  <style>${reportStyles}</style>
</head>
<body>
  <div class="page">
    <header class="header">
      <p class="brand">LexGuard</p>
      <p class="brand-sub">AI Contract Risk Report</p>
      <h1 class="report-title">${escapeHtml(label)}</h1>
      <p class="meta">Generated ${escapeHtml(analyzed)} · ${result.wordCount.toLocaleString()} words analyzed · Powered by Gemini AI</p>
      <p class="meta" style="margin-top:12px;padding:10px 14px;background:#eef2ff;border-radius:8px;border:1px solid #c7d2fe;color:#3730a3">
        <strong>Detected document type:</strong> ${escapeHtml(result.documentType)}
        <span style="color:#6366f1"> · ${result.documentTypeConfidence}% confidence</span>
      </p>
    </header>

    <div class="score-box">
      <div>
        <p class="score-value" style="color:${overall.color}">${score}</p>
        <p class="score-label">Overall risk score (0–100)</p>
      </div>
      <div>
        ${severityBadge(result.overallRisk)}
        <p style="margin-top:10px;font-size:10pt;color:#64748b">${escapeHtml(riskScoreLabel(score))} exposure level</p>
        <div class="severity-grid">${severitySummary}</div>
      </div>
    </div>

    <div class="summary">
      <strong style="color:#0f172a">Executive summary</strong><br /><br />
      ${escapeHtml(result.plainEnglish)}
    </div>

    ${section("Risky clauses", clausesHtml)}
    ${section("Obligations", obligationsHtml)}
    ${section("Liabilities", liabilitiesHtml)}
    ${section("Privacy & data concerns", privacyHtml)}
    ${section("Recommendations", recommendationsHtml)}

    <footer class="footer">
      <strong>Disclaimer:</strong> This report was generated by LexGuard AI-assisted contract analysis.
      It is not legal advice. Consult qualified counsel before signing or negotiating any agreement.
      <br /><br />© ${new Date().getFullYear()} LexGuard
    </footer>

    <p class="no-print" style="margin-top:24px;font-size:9pt;color:#64748b;text-align:center">
      To save as PDF: use your browser’s <strong>Print</strong> dialog and choose <strong>Save as PDF</strong>.
    </p>
  </div>
</body>
</html>`;
}
