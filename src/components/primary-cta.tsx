import Link from "next/link";

const PRIMARY_CTA_CLASS =
  "inline-flex min-w-44 items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 sm:text-base";

type PrimaryCtaProps = {
  label: string;
  ctaLink: string | null;
  isExternal: boolean;
  isInternal: boolean;
};

export function PrimaryCta({
  label,
  ctaLink,
  isExternal,
  isInternal,
}: PrimaryCtaProps) {
  if (isExternal) {
    return (
      <a
        href={ctaLink ?? "#"}
        target="_blank"
        rel="noreferrer"
        className={PRIMARY_CTA_CLASS}
      >
        {label}
      </a>
    );
  }

  if (isInternal) {
    return (
      <Link href={ctaLink ?? "/apps"} className={PRIMARY_CTA_CLASS}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className={PRIMARY_CTA_CLASS}>
      {label}
    </button>
  );
}
