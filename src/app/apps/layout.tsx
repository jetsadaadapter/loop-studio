import { LibraryShell } from "@/app/library/library-shell";

export default function AppsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LibraryShell>{children}</LibraryShell>;
}
