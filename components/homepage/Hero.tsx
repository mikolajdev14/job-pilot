import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 mx-auto h-64 max-w-5xl rounded-full bg-surface-tertiary/50 blur-3xl" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-5 py-16 text-center sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <p className="rounded-full border border-border-muted bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-text-secondary">
          AI powered career workspace
        </p>
        <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-text-black sm:text-5xl lg:text-6xl">
          A calmer control center for your entire job search.
        </h1>
        <p className="mt-6 max-w-2xl text-base font-normal leading-7 text-text-secondary sm:text-lg">
          Find stronger roles, understand every match, and research the company before you apply. Everything stays organized in one focused workspace.
        </p>
        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Get Started
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/find-jobs"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-muted bg-surface px-5 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Find Your First Match
          </Link>
        </div>
      </div>
    </section>
  );
}
