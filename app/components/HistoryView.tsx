"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getHistory,
  deleteHistoryItem,
  HistoryItem,
  RESTORE_HISTORY_KEY,
} from "@/lib/history";
import { riskConfig } from "@/lib/riskStyles";
import { RiskBadge } from "./results/RiskBadge";
import { ClipboardIcon, TrashIcon, ArrowRightIcon } from "./icons";
import { useAuth } from "../context/AuthContext";

export function HistoryView() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      getHistory(token)
        .then(data => setHistory(data))
        .catch(err => console.error(err))
        .finally(() => setMounted(true));
    } else {
      setMounted(true);
    }
  }, [token]);

  const handleOpen = (item: HistoryItem) => {
    sessionStorage.setItem(RESTORE_HISTORY_KEY, JSON.stringify(item));
    router.push("/");
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await deleteHistoryItem(id, token);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  if (history.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <ClipboardIcon className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-medium text-slate-900">
          No analysis history
        </h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Contracts you analyze on the dashboard will be saved here automatically for quick reference.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="btn-primary mt-6 inline-flex items-center gap-2"
        >
          Go to Dashboard
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {history.map((item) => {
        const result = item.result;
        const cfg = riskConfig[result.overallRisk];
        
        return (
          <article
            key={item.id}
            className={`card flex h-full flex-col rounded-xl p-6 transition hover:shadow-md ${cfg.highlight}`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <span
                className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${cfg.border} ${cfg.bg} ${cfg.color}`}
              >
                {result.documentType || "Unknown Type"}
              </span>
              <RiskBadge
                level={result.overallRisk}
                size="sm"
                showRiskLabel
                showDot
              />
            </div>

            <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">
              {item.fileName && !["Template", "Document", "Untitled"].includes(item.fileName)
                ? item.fileName
                : result.documentType
                  ? `${result.documentType} Analysis`
                  : `Contract Analysis`}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(item.timestamp).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            
            <p className="mt-3 flex-1 line-clamp-3 text-sm leading-relaxed text-slate-600">
              {result.plainEnglish}
            </p>

            <div className="mt-4 rounded-lg bg-white/50 p-3 text-sm text-slate-700 ring-1 ring-slate-200/50">
              <div className="flex justify-between py-1">
                <span className="font-medium text-slate-500">Risk Score:</span>
                <span className="font-semibold">{item.riskScore ?? 0}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium text-slate-500">Severity:</span>
                <span className="font-semibold capitalize">{item.severity ?? result.overallRisk}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium text-slate-500">Confidence:</span>
                <span className="font-semibold">{item.confidence ?? 0}%</span>
              </div>
              {item.riskCategories && item.riskCategories.length > 0 && (
                <div className="mt-2 border-t border-slate-200/50 pt-2">
                  <span className="font-medium text-slate-500">Categories:</span>
                  <ul className="mt-1 list-inside list-disc text-slate-600">
                    {item.riskCategories.map((cat, i) => (
                      <li key={i}>{cat}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => handleOpen(item)}
                className="focus-ring flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
              >
                <ArrowRightIcon className="h-4 w-4 shrink-0" aria-hidden />
                Reopen
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                aria-label="Delete history item"
                className="focus-ring inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              >
                <TrashIcon className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
