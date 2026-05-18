import type { Metadata } from "next";
import { TemplatesView } from "../components/TemplatesView";
import { AuthGuard } from "../components/AuthGuard";

export const metadata: Metadata = {
  title: "Templates — LexGuard",
  description:
    "Browse contract templates for employment, privacy, vendor, rental, and more.",
};

export default function TemplatesPage() {
  return (
    <AuthGuard>
      <TemplatesView />
    </AuthGuard>
  );
}
