import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-slate-50/50 px-4 py-12 dark:bg-slate-950">
      {/* Inline styles for custom premium floating & orbital animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-slow {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-10px, -15px) scale(1.05); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(15px, 10px) scale(0.95); }
        }
        @keyframes orbit-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 12s ease-in-out infinite;
        }
        .animate-orbit-cw {
          animation: orbit-cw 25s linear infinite;
        }
        .animate-orbit-ccw {
          animation: orbit-ccw 15s linear infinite;
        }
      `}} />

      {/* Decorative premium ambient glow background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="animate-float-slow absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/5" />
        <div className="animate-float-delayed absolute bottom-1/4 right-1/3 w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-3xl dark:bg-emerald-500/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl dark:bg-blue-500/2 pointer-events-none" />
      </div>

      {/* Glassmorphic Card */}
      <div className="relative z-10 max-w-md w-full rounded-3xl border border-white/40 bg-white/40 p-8 text-center shadow-2xl shadow-slate-100/50 backdrop-blur-xl dark:border-slate-800/40 dark:bg-slate-900/40 dark:shadow-none">
        
        {/* Animated Node Orbit Graphic */}
        <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
          {/* Outermost Orbit with a rotating node */}
          <div className="animate-orbit-cw absolute inset-0 rounded-full border border-dashed border-violet-200 dark:border-violet-900/50">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-violet-400 dark:bg-violet-600 shadow-sm shadow-violet-400" />
          </div>
          
          {/* Inner orbit */}
          <div className="animate-orbit-ccw absolute inset-4 rounded-full border border-dashed border-slate-200/80 dark:border-slate-800/50">
            <div className="absolute bottom-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-600 shadow-sm shadow-emerald-400" />
          </div>
          
          {/* Pulsing glow behind the card */}
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 blur-xl opacity-10 dark:opacity-20 animate-pulse" />
          
          {/* Floating center card */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 shadow-lg border border-white/60 dark:border-slate-800/60 transition-transform duration-500 hover:rotate-6">
            <FileQuestion className="size-9 text-violet-500 dark:text-violet-400" />
            
            {/* Pulsing green badge */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* 404 Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:text-violet-400 mb-4 select-none">
          Error Code 404
        </div>

        {/* Heading */}
        <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white select-none sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-500">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="mb-8 text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          The page or tool you are looking for does not exist, has been removed, or has drifted out of bounds.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98] transition-all duration-200 w-full sm:w-auto"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Dashboard
          </Link>
          <Link
            href="/agents"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/50 px-6 py-3 text-sm font-semibold text-slate-650 hover:bg-white hover:text-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-350 dark:hover:bg-slate-900 dark:hover:text-white dark:hover:border-slate-700 active:scale-[0.98] transition-all duration-200 w-full sm:w-auto"
          >
            <Home className="size-4" aria-hidden="true" />
            AI Developer Team
          </Link>
        </div>
      </div>
    </div>
  );
}
