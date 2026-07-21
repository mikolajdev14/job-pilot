"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardAnalytics, DailyAnalyticsPoint, MatchScoreBucket } from "@/lib/dashboard-types";

type Props = {
  analytics: DashboardAnalytics;
  error?: string;
  variant: "jobs" | "secondary";
};

type TooltipEntry = {
  color?: string;
  name?: string;
  value?: number | string;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
};

function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border-muted bg-surface-secondary px-3 py-2 shadow-card">
      <p className="text-xs font-semibold text-text-primary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="mt-1 text-xs text-text-secondary">{entry.name}: {entry.value}</p>
      ))}
    </div>
  );
}

function ChartState({ error, empty }: { error?: string; empty: boolean }) {
  if (error) {
    return (
      <div className="mt-6 flex min-h-44 items-center justify-center rounded-lg border border-error/30 bg-error/10 p-5 text-center" role="alert">
        <div>
          <p className="text-sm font-semibold text-text-primary">Analytics are unavailable</p>
          <p className="mt-1 max-w-sm text-sm text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="mt-6 flex min-h-44 items-center justify-center rounded-lg border border-border bg-surface-secondary p-5 text-center">
        <div>
          <p className="text-sm font-semibold text-text-primary">No data yet</p>
          <p className="mt-1 text-sm text-text-secondary">New searches and research will appear here.</p>
        </div>
      </div>
    );
  }

  return null;
}

function totalDaily(data: DailyAnalyticsPoint[], key: "jobsFound" | "companyResearch"): number {
  return data.reduce((total, point) => total + point[key], 0);
}

function totalBuckets(data: MatchScoreBucket[]): number {
  return data.reduce((total, bucket) => total + bucket.count, 0);
}

export function AnalyticsCharts({ analytics, error, variant }: Props) {
  const jobsEmpty = totalDaily(analytics.jobsOverTime, "jobsFound") === 0;
  const researchEmpty = totalDaily(analytics.companyResearchActivity, "companyResearch") === 0;
  const distributionEmpty = totalBuckets(analytics.matchScoreDistribution) === 0;

  if (variant === "jobs") {
    return (
      <section aria-labelledby="jobs-over-time-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Discovery</p>
            <h2 id="jobs-over-time-title" className="mt-2 text-lg font-semibold text-text-primary">Jobs found over time</h2>
          </div>
          <span className="rounded-md border border-border bg-surface-secondary px-2 py-1 text-xs text-text-secondary">Last 30 days</span>
        </div>
        <ChartState error={error} empty={jobsEmpty} />
        {!error && !jobsEmpty ? (
          <figure className="mt-6">
            <div className="h-52 w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.jobsOverTime} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} accessibilityLayer>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.7} />
                  <XAxis dataKey="label" hide />
                  <YAxis allowDecimals={false} hide />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border-muted)" }} />
                  <Line type="monotone" dataKey="jobsFound" name="Jobs found" stroke="var(--color-accent)" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "var(--color-accent)", stroke: "var(--color-accent-foreground)" }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <figcaption className="mt-3 flex justify-between text-xs text-text-muted"><span>{analytics.jobsOverTime[0]?.label}</span><span>{analytics.jobsOverTime.at(-1)?.label}</span></figcaption>
            <p className="sr-only">Thirty day job discovery chart.</p>
            <ul className="sr-only">
              {analytics.jobsOverTime.map((point) => <li key={point.date}>{point.date}: {point.jobsFound} jobs found</li>)}
            </ul>
          </figure>
        ) : null}
      </section>
    );
  }

  return (
      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="research-activity-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Research</p>
          <h2 id="research-activity-title" className="mt-2 text-lg font-semibold text-text-primary">Company research activity</h2>
          <ChartState error={error} empty={researchEmpty} />
          {!error && !researchEmpty ? (
            <figure className="mt-6">
              <div className="h-44 w-full" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.companyResearchActivity} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} accessibilityLayer>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.7} />
                    <XAxis dataKey="label" hide />
                    <YAxis allowDecimals={false} hide />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-tertiary)" }} />
                    <Bar dataKey="companyResearch" name="Companies researched" fill="var(--color-success)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <figcaption className="mt-3 flex justify-between text-xs text-text-muted">
                {analytics.companyResearchActivity.map((point) => <span key={point.date}>{point.label}</span>)}
              </figcaption>
              <ul className="sr-only">
                {analytics.companyResearchActivity.map((point) => <li key={point.date}>{point.date}: {point.companyResearch} companies researched</li>)}
              </ul>
            </figure>
          ) : null}
        </section>

        <section aria-labelledby="score-distribution-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Match quality</p>
          <h2 id="score-distribution-title" className="mt-2 text-lg font-semibold text-text-primary">Match score distribution</h2>
          <ChartState error={error} empty={distributionEmpty} />
          {!error && !distributionEmpty ? (
            <figure className="mt-6">
              <div className="h-44 w-full" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.matchScoreDistribution} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} accessibilityLayer>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.7} />
                    <XAxis dataKey="label" hide />
                    <YAxis allowDecimals={false} hide />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-tertiary)" }} />
                    <Bar dataKey="count" name="Jobs" fill="var(--color-info)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <figcaption className="mt-3 grid grid-cols-5 gap-2 text-center text-xs text-text-muted">
                {analytics.matchScoreDistribution.map((bucket) => <span key={bucket.label}>{bucket.label}</span>)}
              </figcaption>
              <ul className="sr-only">
                {analytics.matchScoreDistribution.map((bucket) => <li key={bucket.label}>{bucket.label}: {bucket.count} jobs</li>)}
              </ul>
            </figure>
          ) : null}
        </section>
      </div>
  );
}
