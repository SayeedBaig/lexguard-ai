import {
  computeOverallRiskScore,
  riskScoreLabel,
} from "../computeRiskScore";
import type { AnalysisResult, NegotiationRecommendation, RiskLevel } from "../types";
import { escapeHtml } from "./escapeHtml";
import { reportRisk, reportStyles } from "./reportTheme";

export interface ReportOptions {
  contractLabel?: string;
}

function severityBadge(level: RiskLevel): string {
  const r = reportRisk[level];
  return `<span class="badge" style="color:${r.color};background:${r.bg};border-color:${r.border}">${escapeHtml(r.riskLabel)}</span>`;
}

function leverageLabel(leverage: string): string {
  const map: Record<string, string> = {
    strong: "Strong Leverage",
    moderate: "Moderate Leverage",
    weak: "Limited Leverage",
  };
  const colorMap: Record<string, string> = {
    strong: "#059669",
    moderate: "#d97706",
    weak: "#dc2626",
  };
  const label = map[leverage] ?? "Moderate Leverage";
  const color = colorMap[leverage] ?? "#d97706";
  return `<span style="font-weight:600;color:${color}">${escapeHtml(label)}</span>`;
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

  const negotiationRecs: NegotiationRecommendation[] = result.negotiationRecommendations
    ? Object.values(result.negotiationRecommendations)
    : [];

  const negotiationHtml = (() => {
    if (!result.negotiationStrategy && negotiationRecs.length === 0) return "";

    const strategyBlock = result.negotiationStrategy
      ? `<div class="item" style="background:#f5f3ff22;border-color:#a78bfa">
          <p class="item-title" style="color:#5b21b6">Negotiation Strategy</p>
          <p class="body-text" style="margin-top:6px">${escapeHtml(result.negotiationStrategy)}</p>
          ${result.overallLeverage ? `<p style="margin-top:8px;font-size:9pt">Your leverage: ${leverageLabel(result.overallLeverage)}</p>` : ""}
          ${result.negotiationPriorityFocus ? `<p style="margin-top:6px;font-size:9pt;color:#6b7280"><strong>Priority:</strong> ${escapeHtml(result.negotiationPriorityFocus)}</p>` : ""}
        </div>`
      : "";

    const quickWinsBlock =
      result.quickWins && result.quickWins.length > 0
        ? `<div class="item" style="background:#f0fdf422;border-color:#86efac">
            <p class="item-title" style="color:#15803d">⚡ Quick Wins</p>
            <ul style="margin:8px 0 0 16px;padding:0">
              ${result.quickWins.map((w) => `<li style="font-size:9pt;color:#166534;margin-bottom:4px">${escapeHtml(w)}</li>`).join("")}
            </ul>
          </div>`
        : "";

    const recsBlock =
      negotiationRecs.length === 0
        ? emptyNote("No negotiation recommendations generated.")
        : negotiationRecs
            .map(
              (rec, i) => {
                const r = reportRisk[rec.priority];
                return `
              <div class="item" style="border-color:${r.border};background:${r.bg}22">
                <div class="item-header">
                  <div>
                    <span class="item-title"><span class="rec-num">${i + 1}</span>${escapeHtml(rec.clauseTitle)}</span>
                    <p class="category">${escapeHtml(rec.issue)}</p>
                  </div>
                  ${severityBadge(rec.priority)}
                </div>
                <div style="margin-top:8px">
                  <p style="font-size:9pt;font-weight:600;color:#5b21b6">Recommendation</p>
                  <p class="body-text">${escapeHtml(rec.recommendation)}</p>
                </div>
                <div style="margin-top:6px">
                  <p style="font-size:9pt;font-weight:600;color:#374151">Business Impact</p>
                  <p class="body-text">${escapeHtml(rec.businessImpact)}</p>
                </div>
                ${rec.alternativeWording ? `<div style="margin-top:8px;padding:8px 10px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px">
                  <p style="font-size:9pt;font-weight:600;color:#15803d">Suggested wording</p>
                  <p style="font-size:9pt;font-style:italic;color:#166534;margin-top:4px">&ldquo;${escapeHtml(rec.alternativeWording)}&rdquo;</p>
                </div>` : ""}
                ${!rec.negotiable ? `<p style="margin-top:6px;font-size:8pt;color:#9ca3af">ℹ Standard clause — limited negotiability</p>` : ""}
              </div>`;
              },
            )
            .join("");

    const walkAwayBlock =
      result.walkAwayTriggers && result.walkAwayTriggers.length > 0
        ? `<div class="item" style="background:#fef2f222;border-color:#fca5a5">
            <p class="item-title" style="color:#991b1b">⚠ Walk-Away Triggers</p>
            <ul style="margin:8px 0 0 16px;padding:0">
              ${result.walkAwayTriggers.map((t) => `<li style="font-size:9pt;color:#7f1d1d;margin-bottom:4px">${escapeHtml(t)}</li>`).join("")}
            </ul>
          </div>`
        : "";

    return section(
      "Negotiation Guidance",
      strategyBlock + quickWinsBlock + recsBlock + walkAwayBlock,
    );
  })();

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
      ${escapeHtml(result.executiveSummary || result.plainEnglish)}
    </div>

    ${section("Risky clauses", clausesHtml)}
    ${section("Obligations", obligationsHtml)}
    ${section("Liabilities", liabilitiesHtml)}
    ${section("Privacy & data concerns", privacyHtml)}
    ${section("Recommendations", recommendationsHtml)}
    ${negotiationHtml}

    <footer class="footer">
      <strong>Disclaimer:</strong> This report was generated by LexGuard AI-assisted contract analysis.
      It is not legal advice. Consult qualified counsel before signing or negotiating any agreement.
      <br /><br />© ${new Date().getFullYear()} LexGuard
    </footer>

    <p class="no-print" style="margin-top:24px;font-size:9pt;color:#64748b;text-align:center">
      To save as PDF: use your browser's <strong>Print</strong> dialog and choose <strong>Save as PDF</strong>.
    </p>
  </div>
</body>
</html>`;
}
