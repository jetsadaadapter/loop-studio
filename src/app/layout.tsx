import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { ToastProvider } from "@/components/toast-provider";
import { AlertDialogToastProvider } from "@/components/ui/alert-dialog-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sukhumvitSet = localFont({
  variable: "--font-sukhumvit",
  display: "swap",
  src: [
    {
      path: "./fonts/sukhumvit-set/SukhumvitSet-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/sukhumvit-set/SukhumvitSet-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/sukhumvit-set/SukhumvitSet-Text.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/sukhumvit-set/SukhumvitSet-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/sukhumvit-set/SukhumvitSet-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/sukhumvit-set/SukhumvitSet-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

const geist = localFont({
  variable: "--font-geist",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/Geist/static/Geist-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Geist/static/Geist-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Geist/static/Geist-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Geist/static/Geist-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    // เพิ่มน้ำหนักอื่นๆ ตามที่มีใน static
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loop Studio",
  description: "Task management for AI coding agents",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the per-request nonce set by proxy.ts via the x-nonce response header.
  // Next.js App Router passes response headers back as request headers for Server Components.
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html
      lang="en"
      className={`${sukhumvitSet.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Expose nonce to Next.js so it can stamp inline hydration scripts */}
        <meta name="next-nonce" content={nonce} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-100" suppressHydrationWarning>
        <TooltipProvider>
          <AlertDialogToastProvider>
            <ToastProvider>
              {/* Floating-canvas look: every page sits inside page padding, never flush
                  to the viewport edge. The brand lives inside each page's shell (e.g.
                  the dashboard sidebar), so modal backdrops dim the screen uniformly. */}
              <main className="flex-1 flex flex-col p-4 md:p-6">{children}</main>
            </ToastProvider>
          </AlertDialogToastProvider>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
