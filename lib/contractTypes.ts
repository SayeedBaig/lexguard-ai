export type ContractType =
  | "general"
  | "nda"
  | "msa"
  | "saas"
  | "employment"
  | "privacy";

export const CONTRACT_TYPES: {
  value: ContractType;
  label: string;
  hint: string;
}[] = [
  {
    value: "general",
    label: "General agreement",
    hint: "Auto-detect structure and focus areas",
  },
  {
    value: "nda",
    label: "NDA / Confidentiality",
    hint: "Emphasize disclosure limits, term, and carve-outs",
  },
  {
    value: "msa",
    label: "MSA / Services",
    hint: "Emphasize scope, SLAs, liability, and termination",
  },
  {
    value: "saas",
    label: "SaaS / Subscription",
    hint: "Emphasize uptime, data use, renewal, and IP",
  },
  {
    value: "employment",
    label: "Employment",
    hint: "Emphasize compensation, IP assignment, and restrictive covenants",
  },
  {
    value: "privacy",
    label: "Privacy / DPA",
    hint: "Emphasize processing purpose, subprocessors, and breach notice",
  },
];

export function contractTypePrompt(type: ContractType): string {
  const match = CONTRACT_TYPES.find((t) => t.value === type);
  if (!type || type === "general" || !match) {
    return "Contract type: general (infer the most likely agreement type from the text).";
  }
  return `Contract type: ${match.label}. ${match.hint}.`;
}
