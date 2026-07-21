"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOut } from "@/actions/auth";

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

function Brand() {
  return (
    <Link
      href="/"
      aria-label="JobPilot home"
      className="inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="flex size-9 items-center justify-center rounded-lg border border-border-muted bg-accent text-xs font-bold tracking-tight text-accent-foreground">JP</span>
      <span>
        <span className="block text-sm font-semibold text-text-primary">JobPilot</span>
        <span className="block text-xs text-text-muted">Career workspace</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, startSignOut] = useTransition();
  const isLoginRoute = pathname === "/login" || pathname.startsWith("/callback");
  const isAppRoute = navigationItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  function handleSignOut(): void {
    startSignOut(async () => {
      const result = await signOut();
      if (result.success) router.push("/login");
    });
  }

  if (isLoginRoute) return null;

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-2 sm:px-8 lg:px-10">
        <Brand />

        <nav aria-label="Primary" className="order-3 flex w-full items-center justify-center gap-1 border-t border-border pt-2 sm:order-none sm:w-auto sm:border-t-0 sm:pt-0">
          {navigationItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-4 sm:text-sm ${active ? "bg-surface-tertiary text-text-primary" : "text-text-secondary hover:bg-surface hover:text-text-primary"}`}
              >
                <NavIcon type={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAppRoute ? (
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-muted bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        ) : (
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Start for free
          </Link>
        )}
      </div>
    </header>
  );
}
