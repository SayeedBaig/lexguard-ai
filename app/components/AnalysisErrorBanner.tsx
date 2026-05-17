"use client";

interface AnalysisErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function AnalysisErrorBanner({
  message,
  onDismiss,
}: AnalysisErrorBannerProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <span className="mt-0.5 shrink-0 font-semibold" aria-hidden>
        !
      </span>
      <p className="flex-1 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="focus-ring shrink-0 rounded px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100"
        aria-label="Dismiss error"
      >
        Dismiss
      </button>
    </div>
  );
}
