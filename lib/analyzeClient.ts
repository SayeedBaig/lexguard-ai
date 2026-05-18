import type { AnalysisResult } from "./types";

export async function fetchContractAnalysis(
  contractText: string,
  token: string | null = null,
): Promise<AnalysisResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers,
    body: JSON.stringify({ contractText }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Analysis failed. Please try again.",
    );
  }

  return data as AnalysisResult;
}
