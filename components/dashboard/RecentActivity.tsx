import Link from "next/link";
import type { DashboardActivity } from "@/lib/dashboard-types";

type Props = {
  activities: DashboardActivity[];
  error?: string;
};

export function RecentActivity({ activities, error }: Props) {
  return (
    <section aria-labelledby="recent-activity-title" className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Timeline</p>
          <h2 id="recent-activity-title" className="mt-2 text-lg font-semibold text-text-primary">Recent activity</h2>
        </div>
        <Link href="/find-jobs" className="rounded-md px-2 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">View jobs</Link>
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-error/30 bg-error/10 p-4" role="alert">
          <p className="text-sm font-semibold text-text-primary">Activity is unavailable</p>
          <p className="mt-1 text-sm text-text-secondary">{error}</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="mt-5 rounded-lg border border-border bg-surface-secondary p-5 text-center">
          <p className="text-sm font-semibold text-text-primary">No activity yet</p>
          <p className="mt-1 text-sm text-text-secondary">Run your first job search to start this timeline.</p>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-border">
          {activities.map((activity) => (
            <li key={activity.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${activity.type === "research" ? "bg-success" : "bg-info"}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-5 text-text-primary">{activity.title}</p>
                <p className="mt-1 text-xs text-text-secondary">{activity.detail}</p>
                <time dateTime={activity.occurredAt} className="mt-1 block text-xs text-text-muted">{activity.timeAgo}</time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
