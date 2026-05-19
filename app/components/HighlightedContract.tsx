"use client";

import React, { useMemo } from "react";
import type { AnalysisResult } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RiskyClause {
  title: string;
  excerpt: string;
  explanation: string;
  severity: string;
  category: string;
}

interface Chunk {
  text: string;
  clause?: RiskyClause;
}

interface ClauseMatch {
  clause: RiskyClause;
  length: number;
}

interface HighlightedContractProps {
  contractText: string;
  result: AnalysisResult;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Splits a single text line into plain + highlighted Chunk segments.
 * Matching is done per-line so newline structure is preserved.
 */
function splitLineIntoChunks(line: string, clauseMatches: ClauseMatch[]): Chunk[] {
  const lineMatches: { clause: RiskyClause; start: number; end: number }[] = [];

  for (const { clause } of clauseMatches) {
    const excerpt = clause.excerpt.trim();
    const pos = line.indexOf(excerpt);
    if (pos !== -1) {
      lineMatches.push({ clause, start: pos, end: pos + excerpt.length });
    }
  }

  // Sort left-to-right so we process them in document order
  lineMatches.sort((a, b) => a.start - b.start);

  const chunks: Chunk[] = [];
  let cursor = 0;

  for (const m of lineMatches) {
    if (m.start < cursor) continue; // skip overlapping matches
    if (m.start > cursor) {
      chunks.push({ text: line.substring(cursor, m.start) });
    }
    chunks.push({ text: line.substring(m.start, m.end), clause: m.clause });
    cursor = m.end;
  }

  if (cursor < line.length) {
    chunks.push({ text: line.substring(cursor) });
  }

  return chunks.length > 0 ? chunks : [{ text: line }];
}

/** Returns Tailwind classes for each risk severity level */
function getHighlightStyles(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
    case "high":
      return "bg-red-200/70 text-red-950 border-b-2 border-red-500 cursor-help rounded-sm px-0.5";
    case "medium":
      return "bg-yellow-200/70 text-yellow-950 border-b-2 border-yellow-500 cursor-help rounded-sm px-0.5";
    case "low":
      return "bg-slate-200/80 text-slate-900 border-b border-slate-400 cursor-help rounded-sm px-0.5";
    default:
      return "bg-blue-100/60 text-blue-950 cursor-help rounded-sm px-0.5";
  }
}

/** Detects whether a line looks like a legal heading/section title */
function isLegalHeading(line: string): boolean {
  return (
    /^(\d+[\.\)]\s|[IVXLCDM]+\.\s|[A-Z][A-Z\s]{3,}[:\.]?\s*$|ARTICLE\s|SECTION\s|SCHEDULE\s|EXHIBIT\s|WHEREAS|NOW,\s)/.test(
      line.trim()
    ) && line.trim().length > 0
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HighlightedContract({ contractText, result }: HighlightedContractProps) {
  /**
   * Build the clause match list once.
   * Each entry maps a RiskyClause to its excerpt length for per-line matching.
   */
  const clauseMatches: ClauseMatch[] = useMemo(() => {
    if (!result.riskyClauses?.length) return [];
    return result.riskyClauses
      .filter((c) => c.excerpt?.trim().length > 0)
      .map((clause) => ({ clause, length: clause.excerpt.trim().length }));
  }, [result.riskyClauses]);

  /**
   * Split the contract into individual lines, normalising line endings first.
   * This is the core of the formatting fix — we render each line separately
   * so that newlines, paragraph breaks and clause numbering are preserved.
   */
  const lines = useMemo(
    () => contractText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n"),
    [contractText]
  );

  // How many AI clauses actually matched visible text
  const matchedClauseCount = useMemo(
    () =>
      clauseMatches.filter(({ clause }) =>
        contractText.includes(clause.excerpt.trim())
      ).length,
    [clauseMatches, contractText]
  );

  return (
    <div className="card rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* ── Header ── */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Original Document</h3>
          <p className="text-sm text-slate-500">
            {matchedClauseCount > 0
              ? `${matchedClauseCount} risky clause${matchedClauseCount > 1 ? "s" : ""} highlighted — hover to view AI explanation`
              : "Clause highlighting active — hover over coloured sections for AI notes"}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs font-medium">
          {[
            { color: "bg-red-400 ring-red-200", label: "High / Critical" },
            { color: "bg-yellow-400 ring-yellow-200", label: "Medium" },
            { color: "bg-slate-400 ring-slate-200", label: "Low" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-full ring-2 ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Contract Body ── */}
      <div className="relative max-h-[540px] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 shadow-inner">
        <div className="p-5 text-sm leading-7 text-slate-700 font-mono break-words">
          {lines.map((line, lineIdx) => {
            // Blank line → paragraph spacer
            if (line.trim() === "") {
              return <div key={lineIdx} className="h-4" aria-hidden />;
            }

            const heading = isLegalHeading(line);
            const chunks = splitLineIntoChunks(line, clauseMatches);

            return (
              <div
                key={lineIdx}
                className={[
                  "mb-0.5",
                  heading
                    ? "mt-5 font-semibold text-slate-900 tracking-tight"
                    : "text-slate-700",
                ].join(" ")}
              >
                {chunks.map((chunk, chunkIdx) => {
                  if (!chunk.clause) {
                    return <span key={chunkIdx}>{chunk.text}</span>;
                  }

                  return (
                    <span
                      key={chunkIdx}
                      className={`relative group inline ${getHighlightStyles(chunk.clause.severity)}`}
                      tabIndex={0}
                      role="mark"
                      aria-label={`${chunk.clause.severity} risk — ${chunk.clause.title}`}
                    >
                      {chunk.text}

                      {/* ── Tooltip ── */}
                      <span
                        className={[
                          "pointer-events-none absolute bottom-full left-0 z-20 mb-2",
                          "w-72 max-w-xs rounded-lg bg-slate-900 p-3 text-xs text-white shadow-xl",
                          "opacity-0 transition-opacity duration-150",
                          "group-hover:opacity-100 group-focus:opacity-100",
                        ].join(" ")}
                      >
                        <strong className="mb-1 block font-semibold text-blue-300">
                          {chunk.clause.title}
                          <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-slate-400">
                            ({chunk.clause.severity})
                          </span>
                        </strong>
                        <span className="block leading-relaxed text-slate-300">
                          {chunk.clause.explanation}
                        </span>
                        {/* Caret */}
                        <span className="absolute -bottom-1.5 left-4 h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-slate-900" />
                      </span>
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
