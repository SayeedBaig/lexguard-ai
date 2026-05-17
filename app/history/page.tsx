import { Metadata } from "next";
import { AppShell } from "@/app/components/AppShell";
import { HistoryView } from "@/app/components/HistoryView";

export const metadata: Metadata = {
  title: "History - LexGuard",
  description: "View previously analyzed contracts.",
};

export default function HistoryPage() {
  return (
    <AppShell>
      <main id="main-content" className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Analysis History
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Review past contract analyses, reopen them to view detailed findings, or manage your stored history. Data is saved locally in your browser.
          </p>
        </div>

        <HistoryView />
      </main>
    </AppShell>
  );
}
