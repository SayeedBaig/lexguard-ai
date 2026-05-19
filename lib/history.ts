import { AnalysisResult } from "./types";

export const RESTORE_HISTORY_KEY = "lexguard_restore_history";

export interface HistoryItem {
  id: string;
  contractText: string;
  fileName: string | null;
  result: AnalysisResult;
  timestamp: string;
  riskScore?: number;
  severity?: string;
  confidence?: number;
  riskCategories?: string[];
}

export async function getHistory(token: string): Promise<HistoryItem[]> {
  const response = await fetch("/api/history", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch history");
  }

  return response.json();
}

export async function saveHistoryItem(
  item: Omit<HistoryItem, "id" | "timestamp">,
  token: string
): Promise<HistoryItem> {
  const response = await fetch("/api/history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    throw new Error("Failed to save history");
  }

  return response.json();
}

export async function deleteHistoryItem(id: string, token: string): Promise<void> {
  const response = await fetch(`/api/history/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete history");
  }
}

