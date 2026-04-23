"use client";

import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#F8F9FA] px-6 py-12 md:p-10">
      {/* Premium Background Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[70%] w-[70%] rounded-full bg-rich-mahogany-600/10 blur-[120px] animate-blob" />
        <div className="absolute top-[20%] -right-[10%] h-[60%] w-[60%] rounded-full bg-dark-garnet-600/10 blur-[120px] animate-blob [animation-delay:2s]" />
        <div className="absolute -bottom-[10%] left-[20%] h-[50%] w-[50%] rounded-full bg-rich-mahogany-500/10 blur-[100px] animate-blob [animation-delay:4s]" />

        {/* Sublte Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `radial-gradient(#E2E8F0 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-[400px] flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="mb-0">
            <Image
              src="/images/logo/logo-black-110x30.png"
              alt="Adapter Digital Group"
              width={160}
              height={48}
              className="h-10 w-auto sm:h-12"
              priority
            />
          </div>
          {/* <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Adapter Library
          </h1>
          <p className="text-sm text-neutral-500">
            Internal application repository
          </p> */}
        </div>

        <LoginForm />
      </div>

      <p className="absolute bottom-6 left-0 right-0 z-10 text-center text-xs text-neutral-400">
        &copy; {new Date().getFullYear()} Adapter Digital Group. All rights reserved.
      </p>
    </div>
  );
}

