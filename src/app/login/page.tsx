"use client";

import Image from "next/image";
import { LoginForm } from "@/components/login-form";
import { LoginMobileIntro } from "@/components/login-mobile-intro";

/** Hollow square "handle" node for the design-tool guide frame. */
function GuideNode({ className }: { className: string }) {
  return (
    <span
      className={`absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-[4px] border border-slate-300 bg-white shadow-sm ${className}`}
    />
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand/[0.10] via-brand/[0.03] to-white px-5 py-16 sm:px-6 md:p-10">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[5%] h-[55%] w-[60%] rounded-full bg-brand/[0.10] blur-[140px]" />

        {/* Design-tool guide frame (vertical + horizontal lines) */}
        <div className="absolute inset-0 hidden sm:block">
          {/* Vertical guides */}
          <div className="absolute inset-y-0 left-[30%] w-px bg-slate-300/50" />
          <div className="absolute inset-y-0 left-[70%] w-px bg-slate-300/50" />
          {/* Horizontal guide near the top */}
          <div className="absolute left-0 right-0 top-[12%] h-px bg-slate-300/50" />

          {/* Handle nodes at intersections + bottom ends */}
          <GuideNode className="left-[30%] top-[12%]" />
          <GuideNode className="left-[70%] top-[12%]" />
          <GuideNode className="left-[30%] top-[90%]" />
          <GuideNode className="left-[70%] top-[90%]" />
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center gap-7">
        {/* App icon badge */}
        <div className="motion-hero-enter flex size-12 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-brand/25 ring-1 ring-black/5">
          <Image
            src="/images/logo/logo-app-1200x1200.svg"
            alt="Adapter"
            width={48}
            height={48}
            className="size-full"
            priority
          />
        </div>

        {/* Heading + subtitle above the card */}
        <div className="motion-enter-1 flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            Adapter Library Access
          </h1>
          <p className="max-w-[320px] text-xs leading-relaxed text-slate-500 sm:text-sm">
            Authenticate to access the internal library of MCPs, tools, and
            platforms
          </p>
        </div>

        {/* Stacked login card */}
        <div className="motion-enter-2 w-full">
          <LoginForm />
        </div>
      </div>

      <p className="motion-enter-3 absolute inset-x-0 bottom-6 z-10 px-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Adapter Digital Group. All rights
        reserved.
      </p>

      {/* Mobile-only onboarding hero — slides away to reveal the login */}
      <LoginMobileIntro />
    </div>
  );
}
