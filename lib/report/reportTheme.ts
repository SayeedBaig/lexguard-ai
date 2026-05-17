import type { RiskLevel } from "../types";

/** Print-safe colors for standalone HTML reports (no Tailwind). */
export const reportRisk: Record<
  RiskLevel,
  { label: string; riskLabel: string; color: string; bg: string; border: string }
> = {
  low: {
    label: "Low",
    riskLabel: "Low risk",
    color: "#047857",
    bg: "#ecfdf5",
    border: "#6ee7b7",
  },
  medium: {
    label: "Medium",
    riskLabel: "Medium risk",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fcd34d",
  },
  high: {
    label: "High",
    riskLabel: "High risk",
    color: "#b91c1c",
    bg: "#fef2f2",
    border: "#fca5a5",
  },
};

export const reportStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #0f172a;
    background: #fff;
    padding: 0;
  }
  .page {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 48px;
  }
  .header {
    border-bottom: 2px solid #2563eb;
    padding-bottom: 24px;
    margin-bottom: 32px;
  }
  .brand {
    font-size: 22pt;
    font-weight: 700;
    color: #1e40af;
    letter-spacing: -0.02em;
  }
  .brand-sub {
    font-size: 9pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 4px;
  }
  .report-title {
    font-size: 14pt;
    font-weight: 600;
    margin-top: 16px;
    color: #0f172a;
  }
  .meta {
    font-size: 9pt;
    color: #64748b;
    margin-top: 8px;
  }
  .score-box {
    display: flex;
    align-items: center;
    gap: 24px;
    margin: 28px 0;
    padding: 20px 24px;
    background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
    border: 1px solid #bfdbfe;
    border-radius: 12px;
  }
  .score-value {
    font-size: 36pt;
    font-weight: 700;
    line-height: 1;
  }
  .score-label {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
    margin-top: 4px;
  }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 9pt;
    font-weight: 600;
    border: 1px solid;
  }
  .summary {
    padding: 16px 20px;
    background: #f8fafc;
    border-left: 4px solid #2563eb;
    border-radius: 0 8px 8px 0;
    margin-bottom: 32px;
    font-size: 10pt;
    color: #334155;
  }
  h2.section {
    font-size: 12pt;
    font-weight: 700;
    color: #0f172a;
    margin: 28px 0 14px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
  }
  h2.section:first-of-type { margin-top: 0; }
  .empty {
    font-size: 10pt;
    color: #94a3b8;
    font-style: italic;
    margin-bottom: 16px;
  }
  .item {
    margin-bottom: 16px;
    padding: 16px 18px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    page-break-inside: avoid;
  }
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 10px;
  }
  .item-title {
    font-weight: 600;
    font-size: 11pt;
    color: #0f172a;
  }
  .item-ref {
    font-family: ui-monospace, monospace;
    font-size: 8pt;
    color: #64748b;
    margin-left: 8px;
  }
  .category {
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    margin-top: 4px;
  }
  .excerpt {
    font-family: ui-monospace, monospace;
    font-size: 9pt;
    background: #f1f5f9;
    padding: 12px 14px;
    border-radius: 6px;
    color: #475569;
    margin: 10px 0;
    border-left: 3px solid #cbd5e1;
  }
  .explanation {
    font-size: 10pt;
    color: #475569;
    margin-top: 8px;
  }
  .explanation strong {
    color: #334155;
    font-weight: 600;
  }
  .party {
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #2563eb;
    margin-bottom: 6px;
  }
  .body-text {
    font-size: 10pt;
    color: #475569;
  }
  .rec-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: #2563eb;
    color: #fff;
    border-radius: 50%;
    font-size: 9pt;
    font-weight: 700;
    margin-right: 10px;
    vertical-align: middle;
  }
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    font-size: 8pt;
    color: #94a3b8;
    line-height: 1.6;
  }
  .severity-grid {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  .severity-chip {
    font-size: 9pt;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
  }
  @media print {
    body { padding: 0; }
    .page { padding: 24px 32px; max-width: none; }
    .no-print { display: none !important; }
    .item { break-inside: avoid; }
  }
`;
