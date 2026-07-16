import Image from "next/image";
import Link from "next/link";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/find-jobs", label: "Find Jobs" },
  { href: "/profile", label: "Profile" },
];

export function Navbar() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-6 lg:px-10">
        <Link
          href="/"
          aria-label="JobPilot home"
          className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <Image
            src="/logo.png"
            alt="JobPilot"
            width={496}
            height={168}
            priority
            className="h-auto w-24"
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 sm:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-2 text-sm font-medium text-text-dark transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-overlay-dark px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Start for free
        </Link>
      </div>
    </header>
  );
}
