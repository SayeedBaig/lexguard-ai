import { normalizeDocumentType } from "./contractCategories";
import type { AnalysisResult, RiskLevel } from "./types";

const SAMPLE_CLAUSES = [
  {
    title: "Unlimited liability cap",
    excerpt:
      "…Party shall be liable for any and all damages, including indirect, consequential, and punitive damages, without limitation…",
    explanation:
      "Removes caps on damages and may expose you to uncapped financial liability beyond fees paid.",
    severity: "high" as const,
    category: "Liability",
    lineRef: "§ 8.2",
  },
  {
    title: "Automatic renewal",
    excerpt:
      "…This Agreement shall automatically renew for successive twelve (12) month terms unless terminated in writing at least ninety (90) days prior…",
    explanation:
      "Easy to miss renewal deadlines — you could be locked in for another year without timely written notice.",
    severity: "medium" as const,
    category: "Term",
    lineRef: "§ 3.1",
  },
  {
    title: "Broad indemnification",
    excerpt:
      "…Customer shall indemnify, defend, and hold harmless Provider from any claims arising out of Customer's use of the Services…",
    explanation:
      "You may have to cover the vendor's legal costs for a wide range of claims, even when misuse isn't your fault.",
    severity: "high" as const,
    category: "Indemnity",
    lineRef: "§ 9.4",
  },
  {
    title: "Unilateral amendment",
    excerpt:
      "…Provider may modify this Agreement at any time by posting revised terms on its website; continued use constitutes acceptance…",
    explanation:
      "Terms can change without negotiation — continued use may bind you to less favorable conditions.",
    severity: "medium" as const,
    category: "Governance",
    lineRef: "§ 12.7",
  },
  {
    title: "Data processing scope",
    excerpt:
      "…Provider may process Customer Data for product improvement, analytics, and machine learning model training…",
    explanation:
      "Your data may be used beyond delivering the service — confirm alignment with privacy policies and regulations.",
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

function pickOverall(scores: { low: number; medium: number; high: number; critical: number }): RiskLevel {
  if (scores.critical > 0) return "critical";
  if (scores.high >= scores.medium && scores.high >= scores.low) return "high";
  if (scores.medium >= scores.low) return "medium";
  return "low";
}

function guessDocumentType(text: string): { type: string; confidence: number } {
  const lower = text.toLowerCase();
  if (lower.includes("master services") || lower.includes("msa"))
    return { type: "Master Services Agreement", confidence: 88 };
  if (lower.includes("employment") || lower.includes("employee"))
    return { type: "Employment Agreement", confidence: 85 };
  if (lower.includes("privacy policy") || lower.includes("personal data"))
    return { type: "Privacy Policy", confidence: 86 };
  if (lower.includes("subscription") || lower.includes("saas"))
    return { type: "Subscription Terms", confidence: 82 };
  if (lower.includes("freelance") || lower.includes("independent contractor"))
    return { type: "Freelance Contract", confidence: 84 };
  if (lower.includes("rental") || lower.includes("lease") || lower.includes("landlord"))
    return { type: "Rental Agreement", confidence: 83 };
  if (lower.includes("non-disclosure") || lower.includes("nda"))
    return { type: "Non-Disclosure Agreement", confidence: 87 };
  if (lower.includes("vendor") || lower.includes("supplier"))
    return { type: "Vendor Agreement", confidence: 80 };
  if (lower.includes("terms of service") || lower.includes("terms and conditions"))
    return { type: "Terms of Service", confidence: 81 };
  return { type: "Vendor Agreement", confidence: 72 };
}

export function generateMockAnalysis(contractText: string): AnalysisResult {
  const trimmed = contractText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const seed = hashText(trimmed || "empty");
  const hasContent = wordCount > 20;

  const high = hasContent ? 3 + (seed % 4) : 1;
  const medium = hasContent ? 4 + (seed % 3) : 2;
  const low = hasContent ? 2 + (seed % 5) : 3;
  const critical = hasContent ? (seed % 2) : 0;
  const riskScores = { low, medium, high, critical };

  const clauseCount = hasContent ? Math.min(3 + (seed % 3), SAMPLE_CLAUSES.length) : 2;
  const docGuess = hasContent
    ? guessDocumentType(trimmed)
    : { type: "General Agreement", confidence: 50 };

  return {
    riskScores,
    overallRisk: pickOverall(riskScores),
    documentType: normalizeDocumentType(docGuess.type),
    documentTypeConfidence: docGuess.confidence,
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
    riskScore: hasContent ? 75 + (seed % 20) : 40,
    confidence: docGuess.confidence,
    riskCategories: ["Liability", "Term", "Indemnity", "Governance", "Privacy"],
  };
}

export function simulateAnalysisDelay(ms = 2800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
