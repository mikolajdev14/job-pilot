import Link from "next/link";

const stats = [
  { label: "Total Jobs Found", value: "128", change: "+12%", hint: "all saved roles", icon: "jobs" },
  { label: "Average Match", value: "82%", change: "+4%", hint: "across your search", icon: "match" },
  { label: "Companies Researched", value: "24", change: "+6", hint: "dossiers prepared", icon: "research" },
  { label: "Jobs This Week", value: "18", change: "+9%", hint: "new opportunities", icon: "week" },
];

const activities = [
  { title: "Found 10 roles for Frontend Developer", detail: "Kraków and remote", time: "12 min ago", type: "search" },
  { title: "Research completed for Stripe", detail: "9 dossier sections ready", time: "1 hr ago", type: "research" },
  { title: "Profile updated", detail: "Resume and skills are current", time: "Yesterday", type: "profile" },
  { title: "Saved a 91% match", detail: "Senior React Engineer at Linear", time: "2 days ago", type: "match" },
];

const bars = ["h-20", "h-28", "h-16", "h-36", "h-24", "h-40", "h-32"];
const distribution = [
  { label: "50–59", height: "h-10" },
  { label: "60–69", height: "h-16" },
  { label: "70–79", height: "h-24" },
  { label: "80–89", height: "h-36" },
  { label: "90–100", height: "h-28" },
];

function DashboardIcon({ type }: { type: string }) {
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

export function DashboardPage() {
  return (
    <main id="main-content" className="app-main bg-background">
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

        <section aria-labelledby="profile-readiness-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary text-text-primary"><DashboardIcon type="profile" /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Profile readiness</p>
                <h2 id="profile-readiness-title" className="mt-2 text-lg font-semibold text-text-primary">A few details can make your matches sharper.</h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">Complete your location, education, and portfolio to improve how each role is scored.</p>
              </div>
            </div>
            <Link href="/profile" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-border-muted bg-surface-secondary px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              Complete profile
            </Link>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-border"><span className="block h-full w-3/4 rounded-full bg-accent" /></div>
        </section>

        <section aria-label="Job search statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-xl border border-border bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface-secondary text-text-secondary"><DashboardIcon type={stat.icon} /></span>
                <span className="rounded-md border border-border-muted bg-surface-secondary px-2 py-1 text-xs font-semibold text-text-secondary">{stat.change}</span>
              </div>
              <p className="mt-6 text-3xl font-semibold tracking-tight text-text-primary">{stat.value}</p>
              <h2 className="mt-2 text-sm font-semibold text-text-primary">{stat.label}</h2>
              <p className="mt-1 text-xs text-text-muted">{stat.hint}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <section aria-labelledby="jobs-over-time-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Discovery</p>
                <h2 id="jobs-over-time-title" className="mt-2 text-lg font-semibold text-text-primary">Jobs found over time</h2>
              </div>
              <span className="rounded-md border border-border bg-surface-secondary px-2 py-1 text-xs text-text-secondary">Last 7 days</span>
            </div>
            <figure className="mt-8">
              <svg viewBox="0 0 720 220" role="img" aria-label="Line chart showing jobs found increasing during the last seven days" className="h-auto w-full text-accent">
                <path d="M10 190H710M10 140H710M10 90H710M10 40H710" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                <path d="M10 176 C85 162 105 170 140 145 S220 122 250 134 S330 115 370 98 S455 124 490 88 S570 72 610 50 S675 58 710 30" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <path d="M10 176 C85 162 105 170 140 145 S220 122 250 134 S330 115 370 98 S455 124 490 88 S570 72 610 50 S675 58 710 30 V210 H10 Z" fill="currentColor" fillOpacity="0.05" />
              </svg>
              <figcaption className="mt-3 flex justify-between text-xs text-text-muted"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></figcaption>
            </figure>
          </section>

          <section aria-labelledby="recent-activity-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Timeline</p>
                <h2 id="recent-activity-title" className="mt-2 text-lg font-semibold text-text-primary">Recent activity</h2>
              </div>
              <Link href="/find-jobs" className="rounded-md px-2 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">View jobs</Link>
            </div>
            <ul className="mt-5 divide-y divide-border">
              {activities.map((activity) => (
                <li key={activity.title} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-5 text-text-primary">{activity.title}</p>
                    <p className="mt-1 text-xs text-text-secondary">{activity.detail}</p>
                    <p className="mt-1 text-xs text-text-muted">{activity.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section aria-labelledby="research-activity-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Research</p>
            <h2 id="research-activity-title" className="mt-2 text-lg font-semibold text-text-primary">Company research activity</h2>
            <div className="mt-8 flex h-44 items-end justify-between gap-3 border-b border-border px-2">
              {bars.map((height, index) => <span key={index} className={`w-full max-w-10 rounded-t-md bg-accent/80 ${height}`} />)}
            </div>
            <div className="mt-3 flex justify-between text-xs text-text-muted"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
          </section>

          <section aria-labelledby="score-distribution-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Match quality</p>
            <h2 id="score-distribution-title" className="mt-2 text-lg font-semibold text-text-primary">Score distribution</h2>
            <div className="mt-8 flex h-44 items-end justify-between gap-4 border-b border-border px-2">
              {distribution.map((item) => (
                <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-3">
                  <span className={`w-full rounded-t-md bg-surface-tertiary ${item.height}`} />
                  <span className="text-center text-xs text-text-muted">{item.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
