import Image from "next/image";
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
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-accent-muted via-surface to-info-lightest p-10 lg:flex xl:p-16">
          <Link
            href="/"
            aria-label="JobPilot home"
            className="w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Image src="/logo.png" alt="JobPilot" width={496} height={168} className="h-auto w-28" />
          </Link>
          <div className="max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
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
          <p className="text-sm text-text-muted">A clearer way to search for work.</p>
        </section>

        <section className="flex min-h-screen flex-col items-center justify-center px-6 py-12 sm:px-10">
          <div className="mb-10 lg:hidden">
            <Link
              href="/"
              aria-label="JobPilot home"
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Image src="/logo.png" alt="JobPilot" width={496} height={168} className="h-auto w-28" />
            </Link>
          </div>
          <LoginForm initialError={initialError} />
        </section>
      </div>
    </main>
  );
}
