"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronsRight, Play } from "lucide-react";

const THUMB = 56; // px — slider thumb diameter
const PAD = 6; // px — track inner padding (p-1.5)
const TAP_SLOP = 6; // px — movement under this counts as a tap

/**
 * Mobile-only onboarding hero shown before the login card.
 * Sliding (or tapping) the thumb slides the whole panel away to reveal login.
 */
export function LoginMobileIntro() {
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [maxW, setMaxW] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const maxRef = useRef(0);
  const movedRef = useRef(0);

  const complete = () => {
    setLeaving(true);
    window.setTimeout(() => setDismissed(true), 480);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    maxRef.current = track.clientWidth - THUMB - PAD * 2;
    setMaxW(maxRef.current);
    startXRef.current = e.clientX;
    movedRef.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
    const delta = e.clientX - startXRef.current;
    movedRef.current = Math.max(movedRef.current, Math.abs(delta));
    setDragX(Math.min(Math.max(delta, 0), maxRef.current));
  };

  const onPointerUp = () => {
    const reached = dragX >= maxRef.current * 0.7;
    const tapped = movedRef.current < TAP_SLOP;
    if (reached || tapped) {
      setDragX(maxRef.current);
      complete();
    } else {
      setDragX(0);
    }
  };

  if (dismissed) return null;

  const progress = maxW > 0 ? dragX / maxW : 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden text-white transition-transform duration-[480ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] sm:hidden ${
        leaving ? "-translate-x-full" : "translate-x-0"
      }`}
    >
      {/* Premium dark brand hero */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#2a090c] via-rich-mahogany to-[#12050a]" />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -right-[20%] h-[45%] w-[70%] rounded-full bg-brand/25 blur-[100px]" />
        <div className="absolute bottom-[8%] -left-[15%] h-[35%] w-[60%] rounded-full bg-dark-garnet-600/25 blur-[90px]" />
      </div>

      <div className="flex flex-1 flex-col px-8 pb-10 pt-14">
        {/* Brand */}
        <div className="motion-enter-1 flex items-center">
          <Image
            src="/images/logo/logo-white-330x99.svg"
            alt="Adapter Digital Group"
            width={132}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </div>

        {/* Headline */}
        <div className="motion-enter-2 mt-auto flex flex-col gap-3">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-balance">
            Everything you need,
            <br />
            in one place
          </h1>
          <p className="max-w-[280px] text-sm leading-relaxed text-white/70">
            Your internal library of MCPs, tools, and platforms — unified and
            ready to access.
          </p>
        </div>

        {/* Slide to start */}
        <div className="motion-enter-3 mt-8">
          <div
            ref={trackRef}
            className="relative flex h-[68px] items-center rounded-full border border-white/15 bg-white/10 p-1.5 backdrop-blur-sm select-none"
          >
            {/* Label */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1 text-sm font-semibold text-white/80 transition-opacity"
              style={{ opacity: 1 - progress * 1.4 }}
            >
              <span>Slide to start</span>
              <ChevronsRight className="size-4" />
            </div>

            {/* Thumb */}
            <button
              type="button"
              aria-label="Start — slide to open login"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              className="relative z-10 flex size-14 shrink-0 cursor-grab touch-none items-center justify-center rounded-full bg-white text-brand shadow-lg shadow-black/20 transition-transform active:cursor-grabbing active:scale-95"
              style={{
                transform: `translateX(${dragX}px)`,
                transition: dragX === 0 || leaving ? "transform .3s ease" : "none",
              }}
            >
              <Play className="size-5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
