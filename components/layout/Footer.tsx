import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 py-10 sm:flex-row sm:px-8 lg:px-10">
        <Link
          href="/"
          aria-label="JobPilot home"
          className="inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">JP</span>
          <span className="text-sm font-semibold text-text-primary">JobPilot</span>
        </Link>

        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Dashboard
          </Link>
          <Link
            href="/privacy"
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Terms &amp; Condition
          </Link>
        </nav>
      </div>
    </footer>
  );
}
