import { StoreShell } from "@/app/store/store-shell";

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <StoreShell>{children}</StoreShell>;
}
