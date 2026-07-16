import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-accent-muted via-surface to-info-lightest">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-16 text-center sm:py-20 lg:px-10 lg:py-24">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-text-black sm:text-5xl lg:text-6xl">
          Job hunting is hard.
          <br />
          Your tools shouldn&apos;t be.
        </h1>
        <p className="mt-6 max-w-2xl text-base font-normal leading-7 text-text-secondary sm:text-lg">
          Stop applying blind. JobPilot finds the jobs, researches the companies,
          and gives you everything you need to stand out.
        </p>
        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-overlay-dark px-5 py-2 text-sm font-medium text-surface transition-colors hover:bg-text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Get Started
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/find-jobs"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-5 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Find Your First Match
          </Link>
        </div>
      </div>
    </section>
  );
}
