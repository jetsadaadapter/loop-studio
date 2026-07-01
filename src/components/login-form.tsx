import { cn } from "@/lib/utils";
import { ZeroTrustGoogleButton } from "@/components/zero-trust-google-button";
import { LEGAL_LINKS } from "@/lib/legal-links";

/** Small rivet dot placed in each corner of the card. */
function Rivet({ className }: { className: string }) {
  return (
    <span
      className={`absolute size-1.5 rounded-full bg-slate-300/80 ring-2 ring-white ${className}`}
    />
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("relative", className)} {...props}>
      {/* Stacked sheets fanning upward from behind the card */}
      <div className="absolute inset-x-12 -top-6 h-16 rounded-2xl bg-white/55 shadow-sm ring-1 ring-black/5" />
      <div className="absolute inset-x-7 -top-4 h-16 rounded-2xl bg-white/70 shadow-sm ring-1 ring-black/5" />
      <div className="absolute inset-x-3 -top-2 h-16 rounded-2xl bg-white/90 shadow-sm ring-1 ring-black/5" />

      {/* Main card */}
      <div className="relative overflow-hidden rounded-2xl bg-white px-6 py-7 shadow-xl shadow-slate-300/40 ring-1 ring-black/5 sm:px-8">
        {/* Corner rivets */}
        <Rivet className="left-3 top-3" />
        <Rivet className="right-3 top-3" />
        <Rivet className="bottom-3 left-3" />
        <Rivet className="bottom-3 right-3" />

        <div className="flex flex-col gap-5">
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-rich-mahogany-600 to-dark-garnet-500 opacity-0 blur transition duration-1000 group-hover:opacity-20" />
            <div className="relative">
              <ZeroTrustGoogleButton />
            </div>
          </div>

          <div className="h-px w-full bg-slate-100" />

          <p className="px-2 text-center text-xs leading-relaxed text-slate-400">
            Authorized personnel only. By continuing, you agree to our{" "}
            <a
              href={LEGAL_LINKS.termsOfService}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-brand hover:decoration-brand"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href={LEGAL_LINKS.privacyPolicy}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-brand hover:decoration-brand"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
