import type { Metadata } from "next";
import { ApiDocsClient } from "./docs-client";

export const metadata: Metadata = {
  title: "API Reference — ADT Library",
  description: "Interactive API documentation for the ADT Library integration API",
};

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}
