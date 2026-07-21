import Link from "next/link";

export default function JobDetailsNotFound() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-text-primary">Job not found</h1>
        <p className="mt-3 text-base leading-6 text-text-secondary">This job may have been removed or is not part of your saved matches.</p>
        <Link href="/find-jobs" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Back to Jobs</Link>
      </section>
    </main>
  );
}
