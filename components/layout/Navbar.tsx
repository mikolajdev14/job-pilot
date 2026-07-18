"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/find-jobs", label: "Find Jobs", icon: "search" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

function NavIcon({ type }: { type: string }) {
  if (type === "search") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none"><circle cx="10.8" cy="10.8" r="6.2" stroke="currentColor" strokeWidth="1.8" /><path d="m15.5 15.5 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
  }

  if (type === "profile") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none"><circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" /><path d="M5.5 20c.6-3.3 2.8-5 6.5-5s5.9 1.7 6.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
  }

  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none"><rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" /><rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" /><rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" /><rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" /></svg>;
}

export function Navbar() {
  const pathname = usePathname();

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
              aria-current={pathname === item.href ? "page" : undefined}
              className={`rounded-md border-b-2 px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                pathname === item.href
                  ? "border-accent text-accent"
                  : "border-transparent text-text-dark hover:text-accent"
              }`}
            >
              <span className="flex items-center gap-2"><NavIcon type={item.icon} />{item.label}</span>
            </Link>
          ))}
        </nav>

        {!navigationItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) && (
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-overlay-dark px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Start for free
          </Link>
        )}
      </div>
    </header>
  );
}
