"use client";

import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="self-center">
          <Image
            src="/images/logo/logo-black-110x30.png"
            alt="Adapter Digital Group"
            width={120}
            height={36}
            className="h-8 w-auto"
            unoptimized
            priority
          />
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
