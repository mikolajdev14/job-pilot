import Image from "next/image";
import Link from "next/link";

import { Features } from "@/components/homepage/Features";
import { Hero } from "@/components/homepage/Hero";
import { HowItWorks } from "@/components/homepage/HowItWorks";
import { Testimonial } from "@/components/homepage/Testimonial";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export function Homepage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main-content">
        <Hero />

        <section className="bg-background px-6 py-10 sm:px-10 sm:py-14 lg:px-16">
          <h2 className="sr-only">JobPilot dashboard preview</h2>
          <Image
            src="/images/dashboard-demo.png"
            alt="JobPilot dashboard showing job search statistics and company research activity"
            width={4788}
            height={2416}
            priority
            className="mx-auto h-auto w-full max-w-6xl"
          />
        </section>

        <div aria-hidden="true" className="h-8 border-y border-border bg-surface" />
        <HowItWorks />
        <div aria-hidden="true" className="h-8 border-y border-border bg-surface" />
        <Features />
        <div aria-hidden="true" className="h-8 border-y border-border bg-surface" />
        <Testimonial />

        <section className="bg-gradient-to-br from-accent-muted via-surface to-info-lightest px-6 py-20 text-center sm:px-10 sm:py-24">
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-text-black sm:text-5xl">
            Your next job search can feel a lot less overwhelming
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base font-normal leading-7 text-text-secondary sm:text-lg">
            Set up your profile, upload your resume, and start finding matches
            in minutes.
          </p>
          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-overlay-dark px-5 py-2 text-sm font-medium text-surface transition-colors hover:bg-text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Get Started
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/find-jobs"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-5 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Find Your First Match
            </Link>
          </div>
        </section>

        <div aria-hidden="true" className="h-8 border-y border-border bg-surface" />
      </main>
      <Footer />
    </div>
  );
}
