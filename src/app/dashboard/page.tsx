import { redirect } from "next/navigation";

/**
 * /dashboard → redirects to /manage (the Overview page).
 * The backend menu API uses "/dashboard" as the path for the main Dashboard item.
 * This page provides the actual route so it passes the route-implementation check
 * and seamlessly delivers users to the manage overview.
 */
export default function DashboardRedirectPage() {
  redirect("/manage");
}
