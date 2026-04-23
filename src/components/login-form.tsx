import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ZeroTrustGoogleButton } from "@/components/zero-trust-google-button";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-neutral-200 bg-white shadow-xl shadow-neutral-200/50">
        <CardHeader className="space-y-1 pb-6 pt-8 text-center">
          <CardTitle className="text-xl font-bold tracking-tight text-neutral-900">
            Adapter Library Access
          </CardTitle>
          <CardDescription className="text-sm text-neutral-500">
            Authenticate to access MCPs, tools, and platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-0">
          <div className="flex flex-col gap-6">
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-rich-mahogany-600 to-dark-garnet-500 opacity-0 blur transition duration-1000 group-hover:opacity-20" />
              <div className="relative">
                <ZeroTrustGoogleButton />
              </div>
            </div>

            <div className="flex flex-col gap-3 text-center">
              <p className="text-[11px] leading-relaxed text-neutral-400">
                Authorized personnel only. By continuing, you agree to our{" "}
                <a href="#" className="text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-dark-garnet-600 hover:decoration-dark-garnet-600">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-dark-garnet-600 hover:decoration-dark-garnet-600">
                  Privacy Policy
                </a>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
