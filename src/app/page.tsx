import { redirect } from "next/navigation";

// Stopgap: points at the only remaining feature. Revisit once Loop DevStudio's
// final URL (root vs. /manage/loop-projects) is decided.
export default function Home() {
  redirect("/manage/loop-projects");
}
