"use client";

export function LoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
      aria-describedby="loading-desc"
    >
      <div className="card card-elevated mx-4 w-full max-w-md rounded-xl p-8 text-center shadow-xl">
        <div className="relative mx-auto mb-6 h-14 w-14" aria-hidden>
          <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
          <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-blue-600" />
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-blue-50">
            <div className="h-2 w-2 rounded-full bg-blue-600" />
          </div>
        </div>

        <h2 id="loading-title" className="text-lg font-semibold text-slate-900">
          Analyzing your contract
        </h2>
        <p id="loading-desc" className="mt-2 text-sm text-slate-600">
          Extracting clauses, scoring risk, and preparing your summary
        </p>

        <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Analysis steps">
          {["Parsing document", "Risk assessment", "Generating summary"].map(
            (step) => (
              <li
                key={step}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {step}
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}
