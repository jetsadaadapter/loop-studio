import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Markdown from "react-markdown";
import {
  getAppById,
  getRelatedApps,
} from "@/core/services/apps.service";
import { ApiError } from "@/core/services/api";
import { getAppItemId } from "@/core/interfaces/apps.interface";
import { AppIcon } from "@/components/app-icon";
import { PrimaryCta } from "@/components/primary-cta";
import { MetadataItem } from "@/components/metadata-item";
import { RelatedAppListItem } from "@/components/related-app-list-item";
import { AppCover } from "@/components/app-cover";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export default async function AppDetailPage({ params }: Props) {
  const { id } = await params;

  const initOptions = {
    next: { revalidate: 60 },
  };

  let app = null;
  try {
    app = await getAppById(id, initOptions);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    throw error;
  }

  if (!app) notFound();

  const hasToolCta = !!app.appTool?.tool?.id || !!app.appTool?.toolId;
  const primaryCtaLabel = app.ctaLabel ?? (hasToolCta ? "Run Tool" : "View Guide");
  const hasExternalCta = app.linkType === "external" && !!app.ctaLink && !hasToolCta;
  const hasInternalCta = (app.linkType === "internal" || hasToolCta) && (!!app.ctaLink || hasToolCta);
  const ctaId = app.appTool?.tool?.id || app.appTool?.toolId;
  const ctaLink = hasToolCta ? `/tool/${ctaId}` : app.ctaLink;

  const relatedApps = await getRelatedApps(
    getAppItemId(app),
    typeof app.category === "string" ? app.category : app.category?.name,
    initOptions,
  );
  const coverAccentColor = app.tags.find((tag) => tag.color)?.color;
  const screenshotUrls = [app.imageUrl].filter((value): value is string =>
    Boolean(value),
  );

  return (
    <div className="mx-auto max-w-6xl px-0 pb-8 sm:px-0 lg:pb-10">
      <div className="space-y-6">
        <AppCover
          src={app.imageUrl}
          alt={`${app.name} cover image`}
          accentColor={coverAccentColor}
        >
          <div className="pt-5 sm:pt-8">
            <Link
              href="/apps"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/70"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Library
            </Link>
          </div>

          <div className="relative z-10 flex min-h-64 flex-col justify-end py-5 pt-10 text-white sm:min-h-80 sm:py-8 sm:pt-16 lg:min-h-96 lg:py-10 lg:pt-20">
            <div className="max-w-3xl">
              <div className="flex items-end gap-4">
                <AppIcon
                  name={app.name}
                  iconUrl={app.iconUrl}
                  containerClassName="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-slate-700 shadow-lg ring-1 ring-white/10"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-slate-700 text-white"
                  initialsClassName="text-lg font-bold tracking-tight"
                  imageSizes="64px"
                  imageOuterClassName="absolute inset-0 p-1"
                  imageInnerClassName="relative size-full overflow-hidden rounded-xl"
                  imageClassName="object-cover"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {app.badgeLabel ? (
                      <span className="rounded-full bg-[#75e68f]/20 px-2.5 py-0.5 text-xs font-semibold text-[#84e6a0] ring-1 ring-[#75e68f]/30">
                        {app.badgeLabel}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-white/10">
                      {typeof app.category === "string"
                        ? app.category
                        : app.category?.name}
                    </span>
                  </div>
                  <h1 className="page-hero-title mt-1 text-white">
                    {app.name}
                  </h1>
                </div>
              </div>

              {app.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {app.tags.slice(0, 4).map((tag, index) => (
                    <span
                      key={`hero-tag:${tag.id || tag.tagId || tag.name}:${index}`}
                      className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <PrimaryCta
                  label={primaryCtaLabel}
                  ctaLink={ctaLink}
                  isExternal={hasExternalCta}
                  isInternal={hasInternalCta}
                />
              </div>
            </div>
          </div>
        </AppCover>

        <div className="grid gap-x-10 gap-y-0 pt-2 sm:pt-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          {/* ── Main content ─────────────────────────────────────── */}
          <div className="min-w-0">
            {/* Screenshots */}
            <div className="motion-enter-1 -mx-4 sm:-mx-6 lg:mx-0">
              <div className="flex gap-3 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(screenshotUrls.length > 0 ? screenshotUrls : [""]).map(
                  (src, index) => (
                    <div
                      key={`${src}-${index}`}
                      className="w-64 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:w-72"
                    >
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={`${app.name} screenshot ${index + 1}`}
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
                          No screenshot
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* About */}
            <section className="motion-enter-2 border-t border-slate-200 py-7">
              <h2 className="page-section-title flex items-center gap-2 text-slate-900">
                About this app
              </h2>

              <p className="page-body-copy mt-4 text-slate-700">
                {app.description ||
                  `${app.name} is a ${typeof app.category === "string" ? app.category.toLowerCase() : app.category?.name?.toLowerCase() || "tool"} integration available on the Adapter Library.`}
              </p>

              {/* <div className="mt-6">
                <p className="text-sm font-semibold text-slate-900">
                  Updated on
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {formatDate(app.updatedAt)}
                </p>
              </div> */}

              {app.tags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {app.tags.map((tag, index) => (
                    <span
                      key={`about-tag:${tag.id || tag.tagId || tag.name}:${index}`}
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            {/* Instructions */}
            {app.instructions ? (
              <section className="motion-enter-3 border-t border-slate-200 py-7">
                <h2 className="page-section-title text-slate-900">
                  Instructions
                </h2>
                <div className="page-body-copy mt-4 text-slate-700 space-y-4">
                  <Markdown
                    components={{
                      h1: (props) => (
                        <h1
                          className="text-2xl font-bold text-slate-900 mt-6 mb-4 first:mt-0"
                          {...props}
                        />
                      ),
                      h2: (props) => (
                        <h2
                          className="text-xl font-bold text-slate-900 mt-5 mb-3"
                          {...props}
                        />
                      ),
                      h3: (props) => (
                        <h3
                          className="text-lg font-semibold text-slate-900 mt-4 mb-2"
                          {...props}
                        />
                      ),
                      p: (props) => (
                        <p className="text-slate-700 mb-3" {...props} />
                      ),
                      ul: (props) => (
                        <ul
                          className="list-disc list-inside text-slate-700 mb-3 space-y-1"
                          {...props}
                        />
                      ),
                      ol: (props) => (
                        <ol
                          className="list-decimal list-inside text-slate-700 mb-3 space-y-1"
                          {...props}
                        />
                      ),
                      li: (props) => (
                        <li className="text-slate-700" {...props} />
                      ),
                      code: (
                        props: React.HTMLAttributes<HTMLElement> & {
                          inline?: boolean;
                        },
                      ) => {
                        const { inline, ...rest } = props;
                        return inline ? (
                          <code
                            className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono"
                            {...rest}
                          />
                        ) : (
                          <code
                            className="bg-slate-100 text-slate-800 block p-3 rounded-md text-sm font-mono overflow-x-auto mb-3"
                            {...rest}
                          />
                        );
                      },
                      pre: (props) => (
                        <pre
                          className="bg-slate-900 text-slate-100 p-4 rounded-md text-sm font-mono overflow-x-auto mb-3"
                          {...props}
                        />
                      ),
                      blockquote: (props) => (
                        <blockquote
                          className="border-l-4 border-slate-300 pl-4 italic text-slate-700 my-3"
                          {...props}
                        />
                      ),
                      a: (props) => (
                        <a
                          className="text-brand underline hover:text-brand/80"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {app.instructions}
                  </Markdown>
                </div>
              </section>
            ) : null}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <aside className="motion-enter-3 min-w-0 lg:sticky lg:top-24 lg:self-start">
            {/* Metadata */}
            <div className="py-7 lg:pt-0">
              <div className="space-y-4 text-sm">
                <MetadataItem
                  label="Category"
                  value={
                    typeof app.category === "string"
                      ? app.category
                      : app.category?.name || ""
                  }
                />
                <MetadataItem
                  label="Updated"
                  value={formatDate(app.updatedAt)}
                />
              </div>
            </div>

            {relatedApps.length > 0 ? (
              <section className="border-t border-slate-200 py-7">
                <h3 className="text-base font-semibold text-slate-900">
                  Related apps
                </h3>
                <div className="mt-3 space-y-3">
                  {relatedApps.map((relatedApp, index) => (
                    <RelatedAppListItem
                      key={`related:${getAppItemId(relatedApp) || "app"}:${index}`}
                      item={relatedApp}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
