import type { DashboardStats } from "@/lib/dashboard-types";

type Props = {
  stats: DashboardStats;
  error?: string;
};

type StatDefinition = {
  key: keyof DashboardStats;
  label: string;
  hint: string;
  icon: string;
  suffix?: string;
};

const statDefinitions: StatDefinition[] = [
  { key: "totalJobs", label: "Total Jobs Found", hint: "all saved roles", icon: "jobs" },
  { key: "averageMatchRate", label: "Average Match", hint: "across scored roles", icon: "match", suffix: "%" },
  { key: "companiesResearched", label: "Companies Researched", hint: "dossiers prepared", icon: "research" },
  { key: "jobsThisWeek", label: "Jobs This Week", hint: "found in the last 7 days", icon: "week" },
];

function StatsIcon({ type }: { type: string }) {
  if (type === "match") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><path d="m5 15 4-4 3 3 7-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 6h4v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }

  if (type === "research") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.7" /><path d="m15 15 4.5 4.5M8 10.5h5M10.5 8v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
  }

  if (type === "week") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><rect x="4" y="5.5" width="16" height="14.5" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M8 3.5v4M16 3.5v4M4 9.5h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
  }

  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M8 9h8M8 13h5M8 17h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

export function StatsBar({ stats, error }: Props) {
  return (
    <section aria-label="Job search statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statDefinitions.map((definition) => (
        <article key={definition.key} className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface-secondary text-text-secondary"><StatsIcon type={definition.icon} /></span>
          {error ? (
            <p className="mt-6 text-lg font-semibold text-text-secondary" role="status">Unavailable</p>
          ) : (
            <data value={stats[definition.key]} className="mt-6 block text-3xl font-semibold tracking-tight text-text-primary">
              {stats[definition.key]}{definition.suffix ?? ""}
            </data>
          )}
          <h2 className="mt-2 text-sm font-semibold text-text-primary">{definition.label}</h2>
          <p className="mt-1 text-xs text-text-muted">{error ?? definition.hint}</p>
        </article>
      ))}
    </section>
  );
}
