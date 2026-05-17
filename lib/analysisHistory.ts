import type { AnalysisResult } from "./types";
import type { ContractType } from "./contractTypes";

const STORAGE_KEY = "lexguard:analysis-history";
const MAX_ENTRIES = 12;

export interface HistoryEntry {
  id: string;
  label: string;
  contractType: ContractType;
  contractPreview: string;
  result: AnalysisResult;
  savedAt: string;
}

function readRaw(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function loadAnalysisHistory(): HistoryEntry[] {
  return readRaw();
}

export function saveAnalysisToHistory(
  contractText: string,
  result: AnalysisResult,
  options: { fileName?: string | null; contractType?: ContractType },
): HistoryEntry {
  const trimmed = contractText.trim();
  const firstLine =
    trimmed.split(/\n/).find((line) => line.trim().length > 0)?.trim() ?? "";
  const label =
    options.fileName?.trim() ||
    (firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine) ||
    `Analysis · ${new Date(result.analyzedAt).toLocaleString()}`;

  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    label,
    contractType: options.contractType ?? "general",
    contractPreview: trimmed.slice(0, 280),
    result,
    savedAt: new Date().toISOString(),
  };

  const next = [entry, ...readRaw().filter((e) => e.id !== entry.id)];
  write(next);
  return entry;
}

export function removeHistoryEntry(id: string): HistoryEntry[] {
  const next = readRaw().filter((e) => e.id !== id);
  write(next);
  return next;
}

export function clearAnalysisHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
