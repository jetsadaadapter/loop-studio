import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Bot,
  Code2,
  Database,
  MessageSquare,
  Sparkles,
  Workflow,
} from "lucide-react";
import styles from "./styles.module.css";

type IntegrationResource = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const resources: IntegrationResource[] = [
  { name: "GitHub", href: "https://github.com/features/copilot", icon: Code2 },
  { name: "Notion", href: "https://www.notion.so/product/ai", icon: Blocks },
  {
    name: "Slack",
    href: "https://slack.com/intl/en-th/integrations",
    icon: MessageSquare,
  },
  { name: "Zapier", href: "https://zapier.com/apps", icon: Workflow },
  { name: "OpenAI", href: "https://platform.openai.com/docs", icon: Bot },
  { name: "Supabase", href: "https://supabase.com/docs", icon: Database },
  { name: "Vercel", href: "https://vercel.com/templates", icon: Sparkles },
];

function ResourceLogo({ item }: { item: IntegrationResource }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex min-w-38 items-center justify-center gap-2.5 px-4 py-3 text-slate-500 transition hover:text-slate-900"
      aria-label={`Open ${item.name}`}
    >
      <Icon className="size-6 text-slate-400 transition group-hover:text-brand" />
      <span className="text-lg font-semibold tracking-[-0.03em] text-slate-700 transition group-hover:text-slate-950">
        {item.name}
      </span>
    </Link>
  );
}

export function IntegrationShowcase() {
  const marqueeItems = [...resources, ...resources];

  return (
    <section className="relative mt-10 overflow-hidden px-4 py-16 sm:px-8 sm:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-14 h-56 w-56 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute right-8 bottom-4 h-44 w-44 rounded-full bg-sky-100 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand/70">
          Integrations
        </p>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
          Powering the world&apos;s best product teams
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-lg">
          Connect your workspace to the tools teams already use to plan, ship,
          automate, and scale high-impact operations.
        </p>
      </div>

      <div className="relative mx-auto mt-12 max-w-6xl">
        <div className={styles.viewport}>
          <div className={`${styles.track} gap-3 py-3 sm:gap-6 sm:py-5`}>
            {marqueeItems.map((item, index) => (
              <ResourceLogo key={`${item.name}-${index}`} item={item} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-12 flex justify-center">
        <Link
          href="/store/apps"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-[0_18px_36px_-18px_rgba(194,0,25,0.6)] transition hover:-translate-y-0.5 hover:bg-brand/90"
        >
          Discover all tools
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
