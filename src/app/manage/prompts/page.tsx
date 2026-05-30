import type { Metadata } from "next";
import { ManagePromptsClient } from "./manage-prompts-client";

export const metadata: Metadata = {
  title: "Manage Prompts | Back-Office Admin",
  description: "Create, configure, and manage dynamic system prompt personas and template instructions for AI models.",
};

export default function ManagePromptsPage() {
  return <ManagePromptsClient />;
}
