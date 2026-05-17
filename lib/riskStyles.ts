import type { RiskLevel } from "./types";

export const riskConfig: Record<
  RiskLevel,
  {
    label: string;
    riskLabel: string;
    color: string;
    bg: string;
    border: string;
    bar: string;
    iconBg: string;
    highlight: string;
    clause: {
      card: string;
      excerpt: string;
      explanation: string;
      category: string;
    };
  }
> = {
  low: {
    label: "Low",
    riskLabel: "Low risk",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    iconBg: "bg-emerald-100 text-emerald-700",
    highlight: "card-highlight ring-emerald-200",
    clause: {
      card: "border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 to-white ring-1 ring-emerald-100/80",
      excerpt: "border-emerald-200 bg-emerald-50/50",
      explanation: "border-emerald-100 bg-emerald-50/30",
      category: "bg-emerald-100/80 text-emerald-800 ring-emerald-200/60",
    },
  },
  medium: {
    label: "Medium",
    riskLabel: "Medium risk",
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    bar: "bg-amber-500",
    iconBg: "bg-amber-100 text-amber-800",
    highlight: "card-highlight ring-amber-200",
    clause: {
      card: "border-amber-200/90 bg-gradient-to-br from-amber-50/80 to-white ring-1 ring-amber-100/80",
      excerpt: "border-amber-200 bg-amber-50/50",
      explanation: "border-amber-100 bg-amber-50/30",
      category: "bg-amber-100/80 text-amber-900 ring-amber-200/60",
    },
  },
  high: {
    label: "High",
    riskLabel: "High risk",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    bar: "bg-red-500",
    iconBg: "bg-red-100 text-red-700",
    highlight: "card-highlight ring-red-200",
    clause: {
      card: "border-red-200/90 bg-gradient-to-br from-red-50/80 to-white ring-1 ring-red-100/80",
      excerpt: "border-red-200 bg-red-50/40",
      explanation: "border-red-100 bg-red-50/30",
      category: "bg-red-100/80 text-red-800 ring-red-200/60",
    },
  },
};
