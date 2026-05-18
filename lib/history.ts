import { AnalysisResult } from "./types";

export const HISTORY_STORAGE_KEY = "lexguard_history";
export const RESTORE_HISTORY_KEY = "lexguard_restore_history";

export interface HistoryItem {
  id: string;
  contractText: string;
  fileName: string | null;
  result: AnalysisResult;
  timestamp: string;
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as HistoryItem[];
  } catch (err) {
    console.error("Failed to parse history from localStorage", err);
    return [];
  }
}

export function saveHistoryItem(item: Omit<HistoryItem, "id" | "timestamp">): HistoryItem {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
    timestamp: new Date().toISOString(),
  };
  const updatedHistory = [newItem, ...history];
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  return newItem;
}

export function deleteHistoryItem(id: string): void {
  const history = getHistory();
  const updatedHistory = history.filter((item) => item.id !== id);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
}
