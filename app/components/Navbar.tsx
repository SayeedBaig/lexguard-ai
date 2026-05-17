"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldIcon } from "./icons";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/templates", label: "Templates" },
  { href: "/history", label: "History", disabled: true },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-[4.25rem] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-lg">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm"
            aria-hidden
          >
            <ShieldIcon className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              LexGuard
            </span>
            <p className="hidden text-xs text-slate-500 sm:block">
              Contract Intelligence Platform
            </p>
          </div>
        </Link>

        <nav
          className="flex items-center gap-0.5 md:gap-1 lg:hidden"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            if ("disabled" in item && item.disabled) {
              return (
                <span
                  key={item.href}
                  className="rounded-md px-2.5 py-2 text-sm text-slate-400 md:px-3.5"
                >
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring rounded-md px-2.5 py-2 text-sm font-medium transition-colors md:px-3.5 ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 sm:flex"
            role="status"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            AI engine online
          </span>
          <button type="button" className="btn-secondary hidden sm:inline-flex">
            Sign in
          </button>
          <button
            type="button"
            className="btn-primary !px-4 !py-2 text-sm sm:hidden"
          >
            Sign in
          </button>
        </div>
      </div>
    </header>
  );
}
