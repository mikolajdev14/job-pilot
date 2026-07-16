import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row lg:px-10">
        <Link
          href="/"
          aria-label="JobPilot home"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <Image
            src="/logo.png"
            alt="JobPilot"
            width={496}
            height={168}
            className="h-auto w-24"
          />
        </Link>

        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-6">
          <Link
            href="/dashboard"
            className="rounded-md px-2 py-2 text-sm font-medium text-text-dark transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Dashboard
          </Link>
          <Link
            href="/privacy"
            className="rounded-md px-2 py-2 text-sm font-medium text-text-dark transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="rounded-md px-2 py-2 text-sm font-medium text-text-dark transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Terms &amp; Condition
          </Link>
        </nav>
      </div>
    </footer>
  );
}
