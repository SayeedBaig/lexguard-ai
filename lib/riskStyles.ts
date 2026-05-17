import type { RiskLevel } from "./types";

export const riskConfig: Record<
  RiskLevel,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    bar: string;
    iconBg: string;
    highlight: string;
  }
> = {
  low: {
    label: "Low",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    iconBg: "bg-emerald-100 text-emerald-700",
    highlight: "card-highlight ring-emerald-200",
  },
  medium: {
    label: "Medium",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    bar: "bg-amber-500",
    iconBg: "bg-amber-100 text-amber-700",
    highlight: "card-highlight ring-amber-200",
  },
  high: {
    label: "High",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    bar: "bg-red-500",
    iconBg: "bg-red-100 text-red-700",
    highlight: "card-highlight ring-red-200",
  },
};
