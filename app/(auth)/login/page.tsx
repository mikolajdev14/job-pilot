import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

const errorMessages: Record<string, string> = {
  missing_code: "The sign in session expired. Please try again.",
  missing_verifier: "The sign in session expired. Please try again.",
  oauth_failed: "Sign in could not be completed. Please try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialError = params.error ? errorMessages[params.error] : undefined;

  return (
    <main id="main-content" className="min-h-screen bg-background p-3 sm:p-5">
      <div className="app-panel mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl overflow-hidden rounded-xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between border-e border-border bg-surface-secondary p-10 lg:flex xl:p-16">
          <Link
            href="/"
            aria-label="JobPilot home"
            className="inline-flex w-fit items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">JP</span>
            <span className="text-sm font-semibold text-text-primary">JobPilot</span>
          </Link>
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Your next move
            </p>
            <h2 className="mt-5 text-5xl font-semibold leading-tight tracking-tight text-text-black">
              Make every application count.
            </h2>
            <p className="mt-6 text-lg leading-8 text-text-secondary">
              JobPilot finds relevant roles, explains your match, and helps you
              understand the company before you apply.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["Match", "Research", "Apply"].map((item, index) => (
              <div key={item} className="rounded-lg border border-border bg-surface p-3">
                <span className="text-xs text-text-muted">0{index + 1}</span>
                <p className="mt-3 text-sm font-semibold text-text-primary">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-[calc(100vh-2.5rem)] flex-col items-center justify-center bg-surface px-6 py-12 sm:px-10">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Link
              href="/"
              aria-label="JobPilot home"
              className="inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">JP</span>
              <span className="text-sm font-semibold text-text-primary">JobPilot</span>
            </Link>
          </div>
          <LoginForm initialError={initialError} />
        </section>
      </div>
    </main>
  );
}
