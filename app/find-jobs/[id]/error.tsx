"use client";

import Link from "next/link";

export default function JobDetailsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="app-main flex items-center justify-center bg-background px-4 py-16">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-text-primary">We could not load this job</h1>
        <p className="mt-3 text-base leading-6 text-text-secondary">Please try again, or return to your saved jobs.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Try again</button>
          <Link href="/find-jobs" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Back to Jobs</Link>
        </div>
      </section>
    </main>
  );
}
