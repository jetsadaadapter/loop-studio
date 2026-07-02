import type { Metadata } from "next";
import type { UserProfile } from "@/core/interfaces/auth.interface";
import { getManageUsers } from "@/core/services/users.service";
import { ApiError } from "@/core/services/api";
import { ManageUsersClient } from "./manage-users-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Users — ADT Library",
  description: "Manage users, departments, and roles inside ADT Library",
};

export default async function ManageUsersPage() {
  let initialUsers: UserProfile[] = [];
  try {
    initialUsers = await getManageUsers({ page: 1, limit: 10 });
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      // Silent pass for expected Forbidden status
    } else {
      console.error("Failed to load initial users in server component:", err);
    }
  }

  return <ManageUsersClient initialUsers={initialUsers} />;
}
