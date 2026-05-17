/** Common document types LexGuard can detect (shown in UI + Gemini prompt). */
export const CONTRACT_DOCUMENT_TYPES = [
  "Employment Agreement",
  "Privacy Policy",
  "Vendor Agreement",
  "Subscription Terms",
  "Freelance Contract",
  "Rental Agreement",
  "Master Services Agreement",
  "Non-Disclosure Agreement",
  "Terms of Service",
  "Lease Agreement",
  "Partnership Agreement",
  "Other",
] as const;

export type ContractDocumentType = (typeof CONTRACT_DOCUMENT_TYPES)[number];

const ALIASES: Record<string, ContractDocumentType> = {
  msa: "Master Services Agreement",
  nda: "Non-Disclosure Agreement",
  "master service agreement": "Master Services Agreement",
  "services agreement": "Master Services Agreement",
  tos: "Terms of Service",
  "terms and conditions": "Terms of Service",
  "rental lease": "Rental Agreement",
  "employment contract": "Employment Agreement",
  "independent contractor": "Freelance Contract",
  saas: "Subscription Terms",
};

/** Normalize Gemini output to a display-friendly document type. */
export function normalizeDocumentType(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) return "General Agreement";

  const lower = trimmed.toLowerCase();
  const exact = CONTRACT_DOCUMENT_TYPES.find((t) => t.toLowerCase() === lower);
  if (exact) return exact;

  if (ALIASES[lower]) return ALIASES[lower];

  for (const type of CONTRACT_DOCUMENT_TYPES) {
    if (lower.includes(type.toLowerCase())) return type;
  }

  for (const [alias, type] of Object.entries(ALIASES)) {
    if (lower.includes(alias)) return type;
  }

  return trimmed;
}

export function clampTypeConfidence(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 75;
  return Math.min(100, Math.max(0, Math.round(value)));
}
