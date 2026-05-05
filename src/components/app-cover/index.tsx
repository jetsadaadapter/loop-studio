import Image from "next/image";

type AppCoverProps = {
  src?: string | null;
  alt: string;
  children?: React.ReactNode;
};

export function AppCover({ src, alt, children }: AppCoverProps) {
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
          />
        ) : null}
        <div className="absolute inset-0 bg-linear-to-b from-[#0a0d14]/82 via-[#111827]/62 to-[#111827]/24" />
        <div className="absolute inset-0 bg-linear-to-r from-[#090d16]/98 via-[#111a2a]/80 via-45% to-[#0f172a]/30" />
        <div className="absolute inset-0 bg-radial-[at_10%_50%] from-black/62 via-black/28 to-transparent" />
        <div className="absolute inset-0 bg-radial-[at_75%_30%] from-black/28 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_3px)]" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-size-[4px_4px]" />
      </div>
      {children}
    </section>
  );
}
