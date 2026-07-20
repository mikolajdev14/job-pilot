export default function JobDetailsLoading() {
  return (
    <main className="flex-1 bg-background" aria-busy="true" aria-label="Loading job details">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-11 w-32 animate-pulse rounded-md bg-surface-secondary" />
        <div className="h-32 animate-pulse rounded-xl border border-border bg-surface shadow-sm" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl border border-border bg-surface shadow-sm" />)}</div>
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-40 animate-pulse rounded-xl border border-border bg-surface shadow-sm" />)}
      </div>
    </main>
  );
}
