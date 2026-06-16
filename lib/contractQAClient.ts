import type { ChatMessage, CitedClause } from "@/lib/agents/contractQAAgent";

export interface QAResponse {
  answer: string;
  citations: CitedClause[];
  grounded: boolean;
  runId: string;
}

export async function fetchContractQA(
  contractText: string,
  question: string,
  history: ChatMessage[],
  documentType: string | undefined,
  token: string | null,
): Promise<QAResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/contract-qa", {
    method: "POST",
    headers,
    body: JSON.stringify({ contractText, question, history, documentType }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Q&A failed. Please try again.",
    );
  }

  return data as QAResponse;
}
