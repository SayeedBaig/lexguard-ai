import type { AnalysisResult } from "./types";

export async function fetchContractAnalysis(
  contractText: string,
): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
