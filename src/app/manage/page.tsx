import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import {
  MANAGE_DASHBOARD_FLAGS,
  MANAGE_FUTURE_NAV_ITEMS,
  MANAGE_NAV_ITEMS,
  MANAGE_OVERVIEW_ROUTE,
  getLocalizedText,
} from "@/app/manage/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getManageDashboardStats } from "@/core/services/library.service";

export const dynamic = "force-dynamic";

const activeRoutes = MANAGE_NAV_ITEMS.filter(
  (item) => item.href !== MANAGE_OVERVIEW_ROUTE.href,
);

export default async function ManageOverviewPage() {
  const stats = await getManageDashboardStats().catch(() => null);
  const lastUpdatedLabel = stats?.lastUpdatedAt
    ? new Date(stats.lastUpdatedAt).toLocaleString()
    : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-linear-to-br from-white via-slate-50 to-slate-100 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">Management Workspace</Badge>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Control center for catalog and AI operations
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Choose a workspace to manage live catalog data, AI model settings,
              and the next tools planned for the internal console.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
            <Sparkles className="size-3.5 text-slate-900" />
            Shadcn shell, store-specific workflow
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Quick actions
          </h2>
          <p className="text-sm text-slate-600">
            Jump directly into create flows from the dashboard.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Link href="/manage/apps/create" className="group block outline-none">
            <Card className="h-full border border-slate-200 transition hover:-translate-y-0.5 hover:ring-slate-300 focus-visible:ring-2 focus-visible:ring-slate-400">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Create App</CardTitle>
                    <CardDescription>
                      Open App Manager with create form ready.
                    </CardDescription>
                  </div>
                  <ArrowRight className="size-4 text-slate-400 transition group-hover:text-slate-900" />
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link
            href="/manage/models?action=create"
            className="group block outline-none"
          >
            <Card className="h-full border border-slate-200 transition hover:-translate-y-0.5 hover:ring-slate-300 focus-visible:ring-2 focus-visible:ring-slate-400">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Create AI Model</CardTitle>
                    <CardDescription>
                      Open AI Manager with create form ready.
                    </CardDescription>
                  </div>
                  <ArrowRight className="size-4 text-slate-400 transition group-hover:text-slate-900" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardDescription>Total Apps</CardDescription>
            <CardTitle className="text-3xl font-semibold text-slate-900">
              {stats ? stats.appCount : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Live count from the manage apps API.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardDescription>Active Apps</CardDescription>
            <CardTitle className="text-3xl font-semibold text-slate-900">
              {stats ? stats.activeAppCount : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Apps currently marked as active in catalog management.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardDescription>Total AI Models</CardDescription>
            <CardTitle className="text-3xl font-semibold text-slate-900">
              {stats ? stats.aiModelCount : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Live count from the manage AI models API.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardDescription>Active AI Models</CardDescription>
            <CardTitle className="text-3xl font-semibold text-slate-900">
              {stats ? stats.activeAiModelCount : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Models currently available for runtime selection.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardDescription>Default Model</CardDescription>
            <CardTitle className="truncate text-2xl font-semibold text-slate-900">
              {stats?.defaultAiModelName ?? "Not configured"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Current model selected as the default for AI operations.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white md:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardDescription>Overview Status</CardDescription>
            <CardTitle>
              {stats
                ? "Connected to management APIs"
                : "Unable to load dashboard stats"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              {stats
                ? "This overview is using the same service layer as the individual management pages."
                : "The dashboard still renders, but the stat cards could not fetch live data in this request."}
            </p>
            {lastUpdatedLabel ? (
              <p className="mt-2 text-xs text-slate-500">
                Latest sync: {lastUpdatedLabel}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Available workspaces
          </h2>
          <p className="text-sm text-slate-600">
            Entry points that are already wired to the current backend flows.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {activeRoutes.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group block outline-none"
            >
              <Card className="h-full border border-slate-200 transition hover:-translate-y-0.5 hover:ring-slate-300 focus-visible:ring-2 focus-visible:ring-slate-400">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{getLocalizedText(item.title)}</CardTitle>
                      <CardDescription>
                        {getLocalizedText(item.subtitle)}
                      </CardDescription>
                    </div>
                    <ArrowRight className="size-4 text-slate-400 transition group-hover:text-slate-900" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    Open {getLocalizedText(item.crumb).toLowerCase()} tools and
                    continue with the current management workflow.
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {MANAGE_DASHBOARD_FLAGS.showComingSoon ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Planned modules
            </h2>
            <p className="text-sm text-slate-600">
              Reserved slots for the next phase of the dashboard.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {MANAGE_FUTURE_NAV_ITEMS.map((item) => {
              const label = getLocalizedText(item.label);
              return (
                <Card
                  key={label}
                  size="sm"
                  className="border border-dashed border-slate-300 bg-slate-50/70"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>{label}</CardTitle>
                      <Badge variant="outline">Coming soon</Badge>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
