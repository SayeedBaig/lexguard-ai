import type { ReactNode } from "react";

interface SectionHeaderProps {
  label: string;
  title: string;
  description?: string;
  icon: ReactNode;
  iconClassName?: string;
  trailing?: ReactNode;
  count?: number;
}

export function SectionHeader({
  label,
  title,
  description,
  icon,
  iconClassName = "bg-slate-100 text-slate-600",
  trailing,
  count,
}: SectionHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
          aria-hidden
        >
          {icon}
        </div>
        <div>
          <p className="section-label">{label}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            {count !== undefined && count > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          )}
        </div>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </header>
  );
}
