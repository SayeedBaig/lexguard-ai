export function AppFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6">
      <p className="text-center text-xs text-slate-500">
        © {new Date().getFullYear()} LexGuard · AI-assisted contract review —
        not legal advice. Consult qualified counsel before signing.
      </p>
    </footer>
  );
}
