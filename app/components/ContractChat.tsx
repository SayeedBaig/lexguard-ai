"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import type { ChatMessage } from "@/lib/agents/contractQAAgent";
import { fetchContractQA } from "@/lib/contractQAClient";
import { useAuth } from "@/app/context/AuthContext";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ChatBubbleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

function SendIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
    </svg>
  );
}

function CloseIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinkIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Suggested questions (contract-domain only)
// ---------------------------------------------------------------------------

const SUGGESTED_QUESTIONS = [
  "What are the termination conditions?",
  "Is there a liability cap?",
  "What are the auto-renewal terms?",
  "Who owns the intellectual property?",
  "What data can the company collect?",
  "What are my obligations under this contract?",
];

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      <span className="sr-only">Assistant is thinking…</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-indigo-400"
          style={{ animation: `lgBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          aria-hidden
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
        }`}
        aria-hidden
      >
        {isUser ? "U" : <SparkleIcon className="w-3 h-3" />}
      </div>

      <div
        className={`flex max-w-[85%] flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Bubble */}
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-blue-600 text-white"
              : "rounded-tl-sm bg-white border border-slate-200 text-slate-800 shadow-sm"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="w-full space-y-1">
            {message.citations.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5"
              >
                <LinkIcon className="mt-0.5 w-3 h-3 shrink-0 text-violet-500" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-violet-700">{c.label}</p>
                  <p className="mt-0.5 text-[10px] italic text-violet-600 leading-relaxed line-clamp-2">
                    &ldquo;{c.excerpt}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Panel (inner content, used by both drawer and inline)
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  result: AnalysisResult;
  contractText: string;
  onClose?: () => void;
}

export function ChatPanel({ result, contractText, onClose }: ChatPanelProps) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSubmit = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || isLoading) return;

      if (!contractText?.trim()) {
        setError("No contract context available. Please re-run the analysis.");
        return;
      }

      setQuestion("");
      setError(null);

      const userMsg: ChatMessage = {
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const response = await fetchContractQA(
          contractText,
          trimmed,
          messages,
          result.documentType,
          token,
        );

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: response.answer,
          timestamp: new Date().toISOString(),
          citations: response.citations,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to get answer.";
        setError(msg);
        setMessages((prev) => prev.slice(0, -1));
        setQuestion(trimmed);
      } finally {
        setIsLoading(false);
      }
    },
    [contractText, messages, result.documentType, token, isLoading],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(question);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
            <SparkleIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Contract Assistant</p>
            <p className="text-[10px] text-indigo-200">Powered by Gemini AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => { setMessages([]); setError(null); setQuestion(""); }}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-indigo-200 transition hover:bg-white/10"
              title="Clear conversation"
            >
              <TrashIcon className="w-3 h-3" />
              Clear
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close assistant"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Document context pill */}
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
        <p className="text-[10px] text-slate-500">
          Analyzing:{" "}
          <span className="font-semibold text-slate-700">{result.documentType}</span>
          {" · "}
          <span
            className={`font-semibold ${
              result.overallRisk === "critical"
                ? "text-red-600"
                : result.overallRisk === "high"
                  ? "text-orange-600"
                  : result.overallRisk === "medium"
                    ? "text-amber-600"
                    : "text-emerald-600"
            }`}
          >
            {result.overallRisk.charAt(0).toUpperCase() + result.overallRisk.slice(1)} Risk
          </span>
          {" · "}
          {result.wordCount.toLocaleString()} words
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isEmpty && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100">
              <SparkleIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Ask about this contract</p>
              <p className="mt-0.5 text-xs text-slate-500">Answers grounded in the contract text</p>
            </div>
            <div className="grid w-full grid-cols-1 gap-1.5">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSubmit(q)}
                  disabled={isLoading}
                  className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-left text-xs font-medium text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <SparkleIcon className="w-3 h-3" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-3 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            id="contract-qa-drawer-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this contract…"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            style={{ minHeight: "40px", maxHeight: "100px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 100) + "px";
            }}
            aria-label="Ask a question about this contract"
          />
          <button
            type="button"
            onClick={() => handleSubmit(question)}
            disabled={!question.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[9px] text-slate-400">
          Contract-specific answers only · Not legal advice
        </p>
      </div>

      <style>{`
        @keyframes lgBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floating Contract Chat (button + slide-in drawer)
// ---------------------------------------------------------------------------

interface ContractChatFloatingProps {
  result: AnalysisResult;
  contractText: string;
}

export function ContractChatFloating({ result, contractText }: ContractChatFloatingProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
        aria-label="Open Contract Assistant"
        aria-expanded={open}
      >
        <ChatBubbleIcon className="h-5 w-5" />
        <span className="text-sm font-semibold">Ask AI About This Contract</span>
        {/* Pulse ring */}
        <span className="absolute -right-1 -top-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-violet-500" />
        </span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Slide-in Drawer */}
      <div
        className={`fixed bottom-0 right-0 z-50 flex h-[85vh] max-h-[700px] w-full max-w-[420px] flex-col overflow-hidden rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out sm:bottom-6 sm:right-6 sm:rounded-2xl ${
          open ? "translate-y-0" : "translate-y-[110%]"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Contract Assistant"
      >
        <ChatPanel
          result={result}
          contractText={contractText}
          onClose={() => setOpen(false)}
        />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Legacy inline ContractChat (kept for backwards compat, now renders floating)
// ---------------------------------------------------------------------------

interface ContractChatProps {
  result: AnalysisResult;
  contractText: string;
  visible: boolean;
}

export function ContractChat({ result, contractText, visible }: ContractChatProps) {
  if (!visible) return null;
  return <ContractChatFloating result={result} contractText={contractText} />;
}
