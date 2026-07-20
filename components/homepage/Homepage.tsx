import Image from "next/image";
import Link from "next/link";

import { Features } from "@/components/homepage/Features";
import { Hero } from "@/components/homepage/Hero";
import { HowItWorks } from "@/components/homepage/HowItWorks";
import { Testimonial } from "@/components/homepage/Testimonial";
import { Footer } from "@/components/layout/Footer";

export function Homepage() {
  return (
    <div className="min-h-screen bg-background">
      <main id="main-content">
        <Hero />

        <section className="px-5 pb-8 sm:px-8 lg:px-10 lg:pb-12">
          <div className="app-panel mx-auto max-w-7xl overflow-hidden rounded-xl p-2 sm:p-3">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-text-muted">
              <span className="size-2 rounded-full bg-error/70" />
              <span className="size-2 rounded-full bg-warning/70" />
              <span className="size-2 rounded-full bg-success/70" />
              <span className="ms-3 text-xs">JobPilot workspace</span>
            </div>
            <h2 className="sr-only">JobPilot dashboard preview</h2>
            <Image
              src="/images/dashboard-demo.png"
              alt="JobPilot dashboard showing job search statistics and company research activity"
              width={4788}
              height={2416}
              priority
              className="dashboard-image h-auto w-full rounded-lg"
            />
          </div>
        </section>

        <HowItWorks />
        <Features />
        <Testimonial />

        <section className="px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
          <div className="app-panel mx-auto max-w-7xl rounded-xl px-6 py-14 text-center sm:px-10 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Ready when you are</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-text-black sm:text-5xl">
              Turn your next job search into a focused workflow.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base font-normal leading-7 text-text-secondary sm:text-lg">
              Set up your profile, upload your resume, and start finding stronger matches in minutes.
            </p>
            <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
              <Link href="/login" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
                Get Started <span aria-hidden="true">→</span>
              </Link>
              <Link href="/find-jobs" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-muted bg-surface-secondary px-5 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Find Your First Match
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
