"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardIcon,
  DocumentTypeIcon,
  FileIcon,
  ShieldIcon,
} from "./icons";

const navItems = [
  { href: "/", label: "Dashboard", icon: FileIcon },
  { href: "/templates", label: "Templates", icon: DocumentTypeIcon },
  { href: "/history", label: "History", icon: ClipboardIcon },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-56 shrink-0 border-r border-slate-200 bg-white lg:block xl:w-60"
      aria-label="Sidebar navigation"
    >
      <div className="sticky top-[4.25rem] flex h-[calc(100vh-4.25rem)] flex-col px-3 py-6">
        <div className="mb-6 flex items-center gap-2 px-2 lg:hidden xl:flex">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white"
            aria-hidden
          >
            <ShieldIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Menu</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            if ("disabled" in item && item.disabled) {
              return (
                <span
                  key={item.href}
                  className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400"
                  title="Coming soon"
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                  {item.label}
                  <span className="ml-auto text-[10px] font-medium uppercase tracking-wide">
                    Soon
                  </span>
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Tip
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Preview a template, then analyze it on the Dashboard with Gemini AI.
          </p>
        </div>
      </div>
    </aside>
  );
}
