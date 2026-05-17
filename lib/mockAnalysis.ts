import type { AnalysisResult, RiskLevel } from "./types";

const SAMPLE_CLAUSES = [
  {
    title: "Unlimited liability cap",
    excerpt:
      "…Party shall be liable for any and all damages, including indirect, consequential, and punitive damages, without limitation…",
    severity: "high" as const,
    category: "Liability",
    lineRef: "§ 8.2",
  },
  {
    title: "Automatic renewal",
    excerpt:
      "…This Agreement shall automatically renew for successive twelve (12) month terms unless terminated in writing at least ninety (90) days prior…",
    severity: "medium" as const,
    category: "Term",
    lineRef: "§ 3.1",
  },
  {
    title: "Broad indemnification",
    excerpt:
      "…Customer shall indemnify, defend, and hold harmless Provider from any claims arising out of Customer's use of the Services…",
    severity: "high" as const,
    category: "Indemnity",
    lineRef: "§ 9.4",
  },
  {
    title: "Unilateral amendment",
    excerpt:
      "…Provider may modify this Agreement at any time by posting revised terms on its website; continued use constitutes acceptance…",
    severity: "medium" as const,
    category: "Governance",
    lineRef: "§ 12.7",
  },
  {
    title: "Data processing scope",
    excerpt:
      "…Provider may process Customer Data for product improvement, analytics, and machine learning model training…",
    severity: "low" as const,
    category: "Privacy",
    lineRef: "§ 5.3",
  },
];

const SAMPLE_OBLIGATIONS = [
  {
    id: "o1",
    text: "Maintain commercially reasonable security measures for all Customer Data.",
    kind: "obligation" as const,
    party: "Provider",
  },
  {
    id: "o2",
    text: "Notify the other party within 72 hours of discovering a security incident.",
    kind: "obligation" as const,
    party: "Both parties",
  },
  {
    id: "l1",
    text: "Liable for breach of confidentiality obligations up to 2× annual fees.",
    kind: "liability" as const,
    party: "Provider",
  },
  {
    id: "l2",
    text: "Customer assumes full liability for third-party claims from misuse of Services.",
    kind: "liability" as const,
    party: "Customer",
  },
  {
    id: "o3",
    text: "Provide written notice of termination at least 30 days before contract end.",
    kind: "obligation" as const,
    party: "Customer",
  },
];

const SAMPLE_FINDINGS = [
  {
    id: "f1",
    title: "Asymmetric termination rights",
    description:
      "Provider may terminate for convenience with 15 days notice; Customer requires 90 days.",
    confidence: 94,
    tag: "Fairness",
    severity: "high" as const,
  },
  {
    id: "f2",
    title: "Missing SLA remedies",
    description:
      "Uptime commitments are stated but no service credits or termination rights are defined.",
    confidence: 88,
    tag: "Performance",
    severity: "medium" as const,
  },
  {
    id: "f3",
    title: "Governing law favorable",
    description:
      "Disputes governed by Delaware law with exclusive venue in Wilmington — standard but review for your jurisdiction.",
    confidence: 76,
    tag: "Jurisdiction",
    severity: "low" as const,
  },
  {
    id: "f4",
    title: "IP assignment ambiguity",
    description:
      "Work product ownership clause may conflict with pre-existing materials carve-out in Exhibit B.",
    confidence: 91,
    tag: "IP",
    severity: "medium" as const,
  },
];

function hashText(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickOverall(scores: { low: number; medium: number; high: number }): RiskLevel {
  if (scores.high >= scores.medium && scores.high >= scores.low) return "high";
  if (scores.medium >= scores.low) return "medium";
  return "low";
}

export function generateMockAnalysis(contractText: string): AnalysisResult {
  const trimmed = contractText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const seed = hashText(trimmed || "empty");
  const hasContent = wordCount > 20;

  const high = hasContent ? 3 + (seed % 4) : 1;
  const medium = hasContent ? 4 + (seed % 3) : 2;
  const low = hasContent ? 2 + (seed % 5) : 3;
  const riskScores = { low, medium, high };

  const clauseCount = hasContent ? Math.min(3 + (seed % 3), SAMPLE_CLAUSES.length) : 2;

  return {
    riskScores,
    overallRisk: pickOverall(riskScores),
    riskyClauses: SAMPLE_CLAUSES.slice(0, clauseCount).map((c, i) => ({
      ...c,
      id: `clause-${i}`,
    })),
    plainEnglish: hasContent
      ? `This agreement is a ${wordCount > 500 ? "lengthy" : "moderate"} commercial contract with several provisions that warrant legal review before signing. The liability and indemnification sections place significant risk on the customer, while renewal and amendment clauses favor the provider. Key negotiation points include capping consequential damages, aligning termination notice periods, and narrowing indemnification to third-party IP claims only. Data processing language should be checked against your privacy policy and applicable regulations (e.g., GDPR, CCPA).`
      : "Paste or upload contract text to receive a plain-English summary of key risks, obligations, and negotiation priorities. Demo analysis uses sample intelligence for UI preview — backend AI integration coming soon.",
    obligations: hasContent
      ? SAMPLE_OBLIGATIONS
      : SAMPLE_OBLIGATIONS.slice(0, 2),
    findings: hasContent ? SAMPLE_FINDINGS : SAMPLE_FINDINGS.slice(0, 2),
    privacyConcerns: hasContent
      ? [
          {
            id: "privacy-0",
            title: "Broad data use rights",
            description:
              "Contract may allow processing customer data for analytics and product improvement beyond core service delivery.",
            severity: "medium" as const,
          },
        ]
      : [],
    recommendations: hasContent
      ? [
          {
            id: "rec-0",
            title: "Cap liability exposure",
            description:
              "Negotiate a mutual liability cap tied to fees paid in the prior 12 months.",
            priority: "high" as const,
          },
          {
            id: "rec-1",
            title: "Review auto-renewal terms",
            description:
              "Confirm termination notice aligns with your procurement calendar.",
            priority: "medium" as const,
          },
        ]
      : [],
    analyzedAt: new Date().toISOString(),
    wordCount,
  };
}

export function simulateAnalysisDelay(ms = 2800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
