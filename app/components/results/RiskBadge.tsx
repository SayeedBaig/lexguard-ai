import type { RiskLevel } from "@/lib/types";
import { riskConfig } from "@/lib/riskStyles";

type BadgeSize = "sm" | "md" | "lg";

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-4 py-1.5 text-sm",
};

interface RiskBadgeProps {
  level: RiskLevel;
  size?: BadgeSize;
  className?: string;
  showDot?: boolean;
  /** Use "High risk" style labels instead of "High" */
  showRiskLabel?: boolean;
}

export function RiskBadge({
  level,
  size = "md",
  className = "",
  showDot = false,
  showRiskLabel = false,
}: RiskBadgeProps) {
  const cfg = riskConfig[level];
  const text = showRiskLabel ? cfg.riskLabel : cfg.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${cfg.border} ${cfg.bg} ${cfg.color} ${sizeClasses[size]} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.bar}`}
          aria-hidden
        />
      )}
      {text}
    </span>
  );
}
