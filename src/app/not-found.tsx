import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-slate-100 p-6 ring-1 ring-slate-900/5">
        <FileQuestion className="size-12 text-slate-400" aria-hidden="true" />
      </div>
      
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Page Not Found
      </h1>
      
      <p className="mb-8 max-w-md text-base text-slate-600 sm:text-lg">
        The page or tool you are looking for does not exist, has been removed, or the link is invalid.
      </p>
      
      <Link
        href="/apps"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Library
      </Link>
    </div>
  );
}
