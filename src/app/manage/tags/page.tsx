import type { Metadata } from "next";
import type { ManageTagApiItem } from "@/core/interfaces/tags.interface";
import { getManageTags } from "@/core/services/tags.service";
import { ManageTagsClient } from "./manage-tags-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Tags — ADT Library",
  description: "Manage tags for apps and content inside ADT Library",
};

export default async function ManageTagsPage() {
  let initialTags: ManageTagApiItem[] = [];
  try {
    initialTags = await getManageTags();
  } catch {
    // Client component will handle re-fetch and error display
  }

  return <ManageTagsClient initialTags={initialTags} />;
}
