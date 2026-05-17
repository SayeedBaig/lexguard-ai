import type { Metadata } from "next";
import { TemplatesView } from "../components/TemplatesView";

export const metadata: Metadata = {
  title: "Templates — LexGuard",
  description:
    "Browse contract templates for employment, privacy, vendor, rental, and more.",
};

export default function TemplatesPage() {
  return <TemplatesView />;
}
