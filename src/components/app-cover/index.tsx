import Image from "next/image";

type AppCoverProps = {
  src?: string | null;
  alt: string;
  accentColor?: string | null;
  children?: React.ReactNode;
};

type CoverTone =
  | "rose"
  | "amber"
  | "emerald"
  | "teal"
  | "sky"
  | "indigo"
  | "violet";

const COVER_TONE_CLASS: Record<CoverTone, string> = {
  rose: "bg-linear-to-r from-[#090d16]/98 via-rose-900/70 via-45% to-rose-700/30",
  amber:
    "bg-linear-to-r from-[#090d16]/98 via-amber-900/70 via-45% to-amber-700/30",
  emerald:
    "bg-linear-to-r from-[#090d16]/98 via-emerald-900/70 via-45% to-emerald-700/30",
  teal: "bg-linear-to-r from-[#090d16]/98 via-teal-900/70 via-45% to-teal-700/30",
  sky: "bg-linear-to-r from-[#090d16]/98 via-sky-900/70 via-45% to-sky-700/30",
  indigo:
    "bg-linear-to-r from-[#090d16]/98 via-indigo-900/70 via-45% to-indigo-700/30",
  violet:
    "bg-linear-to-r from-[#090d16]/98 via-violet-900/70 via-45% to-violet-700/30",
};

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHexColor(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) return null;

  if (trimmed.length === 4) {
    const short = trimmed.slice(1);
    return `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`;
  }

  return trimmed;
}

function toRgbTuple(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return [red, green, blue];
}

function toHue(red: number, green: number, blue: number): number {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) return 210;

  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  const degrees = Math.round(hue * 60);
  return degrees < 0 ? degrees + 360 : degrees;
}

function mapHueToTone(hue: number): CoverTone {
  if (hue < 20 || hue >= 340) return "rose";
  if (hue < 55) return "amber";
  if (hue < 105) return "emerald";
  if (hue < 180) return "teal";
  if (hue < 235) return "sky";
  if (hue < 285) return "indigo";
  return "violet";
}

export function AppCover({ src, alt, accentColor, children }: AppCoverProps) {
  const safeAccent = normalizeHexColor(accentColor) ?? "#0ea5e9";
  const [red, green, blue] = toRgbTuple(safeAccent);
  const tone = mapHueToTone(toHue(red, green, blue));

  return (
    <section className="motion-hero-enter relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#1d2028] text-white shadow-[0_30px_72px_-44px_rgba(2,6,23,0.92)]">
      <div className="absolute inset-0">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            unoptimized
          />
        ) : null}
        <div className="absolute inset-0 bg-linear-to-b from-[#0a0d14]/82 via-[#111827]/62 to-[#111827]/24" />
        <div className={`absolute inset-0 ${COVER_TONE_CLASS[tone]}`} />
        <div className="absolute inset-0 bg-radial-[at_10%_50%] from-black/62 via-black/28 to-transparent" />
        <div className="absolute inset-0 bg-radial-[at_75%_30%] from-black/28 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_3px)]" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-size-[4px_4px]" />
      </div>
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-4">
        {children}
      </div>
    </section>
  );
}
