import type { Metadata } from "next";
import type { CategoryInfo } from "@/core/interfaces/categories.interface";
import { getManageCategories } from "@/core/services/categories.service";
import { ManageCategoriesClient } from "./manage-categories-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Categories — ADT Library",
  description: "Manage categories for apps and content inside ADT Library",
};

export default async function ManageCategoriesPage() {
  let initialCategories: CategoryInfo[] = [];
  try {
    initialCategories = await getManageCategories();
  } catch {
    // Client component will handle re-fetch and error display
  }

  return <ManageCategoriesClient initialCategories={initialCategories} />;
}
