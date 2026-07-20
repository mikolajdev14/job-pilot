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
      <span className="flex size-9 items-center justify-center rounded-lg border border-border-muted bg-accent text-xs font-bold tracking-tight text-accent-foreground">
        JP
      </span>
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
  const isProtectedRoute = navigationItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  function handleSignOut(): void {
    startSignOut(async () => {
      const result = await signOut();
      if (result.success) router.push("/login");
    });
  }

  if (isLoginRoute) return null;

  if (!isProtectedRoute) {
    return (
      <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
          <Brand />
          <nav aria-label="Primary" className="hidden items-center gap-2 sm:flex">
            {navigationItems.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <NavIcon type={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Start for free
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="flex min-h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <Brand />
        <nav aria-label="Mobile primary" className="flex items-center gap-1">
          {navigationItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`flex size-11 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? "bg-accent text-accent-foreground" : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"}`}
              >
                <NavIcon type={item.icon} />
              </Link>
            );
          })}
        </nav>
      </header>

      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-border bg-surface p-3 lg:flex">
        <div className="border-b border-border px-3 py-3">
          <Brand />
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface-secondary p-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full border border-border-muted bg-surface-tertiary text-sm font-semibold text-text-primary">JP</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">Your workspace</p>
              <p className="truncate text-xs text-text-muted">Job search control</p>
            </div>
          </div>
        </div>

        <nav aria-label="Primary" className="mt-6 flex flex-1 flex-col">
          <p className="px-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Menu</p>
          <ul className="mt-2 space-y-1">
            {navigationItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? "border-border-muted bg-surface-tertiary text-text-primary shadow-card" : "border-transparent text-text-secondary hover:bg-surface-secondary hover:text-text-primary"}`}
                  >
                    <NavIcon type={item.icon} />
                    {item.label}
                    {active ? <span aria-hidden="true" className="ms-auto size-1.5 rounded-full bg-accent" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-8 px-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Workspace</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/profile" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <NavIcon type="profile" />
                Resume profile
              </Link>
            </li>
            <li>
              <Link href="/find-jobs" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <NavIcon type="search" />
                Company research
              </Link>
            </li>
          </ul>
        </nav>

        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">JobPilot AI</p>
          <p className="mt-2 text-sm font-semibold text-text-primary">Your search, organized.</p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">Match roles, research teams, and keep your profile ready.</p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-3 inline-flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none"><path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M14 8l4 4-4 4M9 12h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </aside>
    </>
  );
}
