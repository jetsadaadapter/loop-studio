import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
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

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "App Store",
  description: "Internal app store for Adapter teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${sukhumvitSet.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
