"use client";

import { useState } from "react";
import type { AnalysisResult, NegotiationRecommendation, RiskLevel } from "@/lib/types";
import { ResultSection } from "./results/ResultSection";
import { SectionHeader } from "./results/SectionHeader";
import { RiskBadge } from "./results/RiskBadge";

// ---------------------------------------------------------------------------
// Icons (inline SVGs — no new deps)
// ---------------------------------------------------------------------------

function HandshakeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 11l-5 3 5 3M15 11l5 3-5 3M12 5v14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 9l3-3 4 2 4-2 3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LightningIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L4.09 12.96A1 1 0 005 14.5h6.5L10 22l9.91-10.96A1 1 0 0019 9.5H12.5L13 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalkAwayIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 15l-5-5 5-5M19 20v-1a4 4 0 00-4-4H5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({
  open,
  className = "w-4 h-4",
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`${className} transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Leverage Badge
// ---------------------------------------------------------------------------

const LEVERAGE_CONFIG = {
  strong: {
    label: "Strong Leverage",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  moderate: {
    label: "Moderate Leverage",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  weak: {
    label: "Limited Leverage",
    className: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
};

function LeverageBadge({
  leverage,
}: {
  leverage: "strong" | "moderate" | "weak";
}) {
  const cfg = LEVERAGE_CONFIG[leverage];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Individual Negotiation Recommendation Card
// ---------------------------------------------------------------------------

function NegotiationCard({
  rec,
  index,
}: {
  rec: NegotiationRecommendation;
  index: number;
}) {
  const [showAlt, setShowAlt] = useState(false);

  const priorityBorderClass: Record<RiskLevel, string> = {
    critical: "border-red-300 bg-red-50/30",
    high: "border-orange-300 bg-orange-50/20",
    medium: "border-amber-200 bg-amber-50/20",
    low: "border-slate-200 bg-white",
  };

  const indexBg: Record<RiskLevel, string> = {
    critical: "from-red-600 to-red-700",
    high: "from-orange-500 to-orange-600",
    medium: "from-amber-500 to-amber-600",
    low: "from-slate-500 to-slate-600",
  };

  return (
    <li
      className={`rounded-xl border p-5 shadow-sm transition hover:shadow-md ${priorityBorderClass[rec.priority]}`}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${indexBg[rec.priority]} text-sm font-bold text-white shadow-sm`}
          aria-hidden
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{rec.clauseTitle}</h3>
            <RiskBadge level={rec.priority} size="sm" showDot />
            {!rec.negotiable && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Standard clause
              </span>
            )}
          </div>

          {/* Issue */}
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            <span className="font-medium text-slate-800">Issue: </span>
            {rec.issue}
          </p>

          {/* Recommendation */}
          <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50/60 p-3">
            <p className="text-sm font-semibold text-violet-800">Recommendation</p>
            <p className="mt-1 text-sm leading-relaxed text-violet-700">{rec.recommendation}</p>
          </div>

          {/* Business Impact */}
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-sm font-semibold text-slate-700">Business Impact</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{rec.businessImpact}</p>
          </div>

          {/* Alternative Wording (collapsible) */}
          {rec.alternativeWording && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowAlt((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                aria-expanded={showAlt}
              >
                <span>{showAlt ? "Hide" : "Show"} suggested wording</span>
                <ChevronIcon open={showAlt} />
              </button>
              {showAlt && (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Suggested alternative wording
                  </p>
                  <p className="text-sm italic leading-relaxed text-emerald-800">
                    &ldquo;{rec.alternativeWording}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface NegotiationSectionProps {
  result: AnalysisResult;
  visible: boolean;
}

export function NegotiationSection({ result, visible }: NegotiationSectionProps) {
  const [strategyOpen, setStrategyOpen] = useState(false);

  if (!visible) return null;

  const recommendations = result.negotiationRecommendations
    ? Object.values(result.negotiationRecommendations)
    : [];

  const hasNegotiationData =
    result.negotiationStrategy ||
    recommendations.length > 0 ||
    (result.quickWins && result.quickWins.length > 0);

  if (!hasNegotiationData) return null;

  const leverage = result.overallLeverage ?? "moderate";

  // Sort: critical first, then high, medium, low
  const priorityOrder: Record<RiskLevel, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const sortedRecs = [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  return (
    <ResultSection
      id="negotiation-recommendations"
      empty={!hasNegotiationData}
      className="border-violet-200/80 bg-gradient-to-br from-violet-50/40 via-white to-white"
    >
      <SectionHeader
        label="Agent 3 · Negotiation Recommender"
        title="Negotiation Guidance"
        description="Clause-by-clause negotiation strategy, business impact analysis, and suggested wording"
        count={sortedRecs.length}
        icon={<HandshakeIcon className="h-5 w-5" />}
        iconClassName="bg-violet-600 text-white"
        trailing={<LeverageBadge leverage={leverage} />}
      />

      {/* Priority Focus */}
      {result.negotiationPriorityFocus && (
        <div className="mb-5 rounded-xl border border-violet-200 bg-violet-50/70 p-4">
          <p className="text-sm font-semibold text-violet-800">📍 Where to focus first</p>
          <p className="mt-1 text-sm leading-relaxed text-violet-700">
            {result.negotiationPriorityFocus}
          </p>
        </div>
      )}

      {/* Negotiation Strategy (collapsible) */}
      {result.negotiationStrategy && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setStrategyOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
            aria-expanded={strategyOpen}
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Negotiation Strategy</p>
              <p className="text-xs text-slate-500">Overall approach for this contract</p>
            </div>
            <ChevronIcon open={strategyOpen} className="w-5 h-5 text-slate-400" />
          </button>
          {strategyOpen && (
            <div className="border-t border-slate-200 px-5 py-4">
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {result.negotiationStrategy}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Wins */}
      {result.quickWins && result.quickWins.length > 0 && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <LightningIcon className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">Quick Wins</p>
            <span className="text-xs text-emerald-600">— easy asks commonly accepted</span>
          </div>
          <ul className="space-y-2">
            {result.quickWins.map((win, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">
                  {i + 1}
                </span>
                {win}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-Clause Recommendations */}
      {sortedRecs.length > 0 && (
        <ol className="space-y-4">
          {sortedRecs.map((rec, i) => (
            <NegotiationCard key={rec.clauseId || i} rec={rec} index={i} />
          ))}
        </ol>
      )}

      {/* Walk-Away Triggers */}
      {result.walkAwayTriggers && result.walkAwayTriggers.length > 0 && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <WalkAwayIcon className="w-4 h-4 text-red-600" />
            <p className="text-sm font-semibold text-red-800">Walk-Away Triggers</p>
            <span className="text-xs text-red-500">
              — conditions where you should reconsider signing
            </span>
          </div>
          <ul className="space-y-2">
            {result.walkAwayTriggers.map((trigger, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="mt-0.5 shrink-0 text-red-400" aria-hidden>
                  ✕
                </span>
                {trigger}
              </li>
            ))}
          </ul>
        </div>
      )}
    </ResultSection>
  );
}
