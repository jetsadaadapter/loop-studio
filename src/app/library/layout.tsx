import { LibraryShell } from "@/app/library/library-shell";

export default function LibraryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LibraryShell>{children}</LibraryShell>;
}
