import { ReactNode } from "react";
import { Metadata } from "next";
import { LibraryShell } from "@/app/library/library-shell";

export const metadata: Metadata = {
  title: "Tools | Adapter Library",
  description: "Run AI tools and scrapers to analyze data.",
};

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return <LibraryShell>{children}</LibraryShell>;
}
