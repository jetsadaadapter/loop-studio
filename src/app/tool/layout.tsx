import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools | Adapter Library",
  description: "Run AI tools and scrapers to analyze data.",
};

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pb-10">{children}</main>
    </div>
  );
}
