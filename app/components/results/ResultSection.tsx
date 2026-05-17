import type { ReactNode } from "react";

interface ResultSectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  empty?: boolean;
}

export function ResultSection({
  children,
  id,
  className = "",
  empty = false,
}: ResultSectionProps) {
  if (empty) return null;

  return (
    <section
      id={id}
      className={`card card-elevated animate-fade-in-up rounded-xl p-6 sm:p-8 ${className}`}
    >
      {children}
    </section>
  );
}
