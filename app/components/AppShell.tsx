import type { ReactNode } from "react";
import { AppFooter } from "./AppFooter";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="page-texture flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
      <AppFooter />
    </div>
  );
}
