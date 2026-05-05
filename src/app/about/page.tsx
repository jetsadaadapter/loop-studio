import type { Metadata } from "next";
import { AboutPageClient } from "./about-page-client";

export const metadata: Metadata = {
  title: "About — Adapter Library",
  description:
    "The agency's collective brain. One platform, every tool, MCP, dataset, and skill we've built.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
