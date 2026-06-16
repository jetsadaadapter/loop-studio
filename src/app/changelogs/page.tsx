import type { Metadata } from "next";
import { ChangelogsClient } from "./changelogs-client";

export const metadata: Metadata = {
  title: "Changelogs — Adapter Library",
  description:
    "อัปเดตล่าสุด ฟีเจอร์ใหม่ การแก้ไขปัญหา และการปรับปรุงประสิทธิภาพของ Adapter Library",
};

export default function ChangelogsPage() {
  return <ChangelogsClient />;
}
