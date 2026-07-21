import Link from "next/link";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatsBar } from "@/components/dashboard/StatsBar";
import type { DashboardPageData } from "@/lib/dashboard-types";

type Props = {
  data: DashboardPageData;
};

function ProfileIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" /><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

export function DashboardPage({ data }: Props) {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Workspace / Overview</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">Welcome back</h1>
            <p className="mt-2 max-w-2xl text-base leading-6 text-text-secondary">Your job search is moving. Here is the latest across matches, research, and profile readiness.</p>
          </div>
          <Link href="/find-jobs" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Find new jobs
          </Link>
        </header>

        {!data.profileComplete ? (
          <section aria-labelledby="profile-readiness-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary text-text-primary"><ProfileIcon /></span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Profile readiness</p>
                  <h2 id="profile-readiness-title" className="mt-2 text-lg font-semibold text-text-primary">A few details can make your matches sharper.</h2>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">Complete your profile to improve how each role is scored.</p>
                </div>
              </div>
              <Link href="/profile" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-border-muted bg-surface-secondary px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Complete profile
              </Link>
            </div>
          </section>
        ) : null}

        <StatsBar stats={data.stats} error={data.databaseError} />

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <AnalyticsCharts analytics={data.analytics} error={data.analyticsError} variant="jobs" />
          <RecentActivity activities={data.activities} error={data.databaseError} />
        </div>

        <AnalyticsCharts analytics={data.analytics} error={data.analyticsError} variant="secondary" />
      </div>
    </main>
  );
}
