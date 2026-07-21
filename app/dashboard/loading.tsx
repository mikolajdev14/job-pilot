export default function DashboardLoading() {
  return (
    <main id="main-content" className="min-h-screen bg-background" aria-busy="true">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="h-24 animate-pulse rounded-xl bg-surface" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-xl border border-border bg-surface" />)}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="h-80 animate-pulse rounded-xl border border-border bg-surface" />
          <div className="h-80 animate-pulse rounded-xl border border-border bg-surface" />
        </div>
        <p className="sr-only" role="status">Loading your dashboard</p>
      </div>
    </main>
  );
}
