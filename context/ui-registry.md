# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Navbar

Path: `components/layout/Navbar.tsx`

Root classes: `border-b border-border bg-surface`

Layout classes: `mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-6 lg:px-10`

Navigation link classes: `rounded-md border-b-2 px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`; inactive links add `border-transparent text-text-dark hover:text-accent`, active links add `border-accent text-accent` and `aria-current="page"`

Primary action classes: `inline-flex min-h-11 items-center justify-center rounded-md bg-overlay-dark px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`

### Footer

Path: `components/layout/Footer.tsx`

Root classes: `border-t border-border bg-surface`

Layout classes: `mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row lg:px-10`

Footer link classes: `rounded-md px-2 py-2 text-sm font-medium text-text-dark transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`

### Hero

Path: `components/homepage/Hero.tsx`

Root classes: `bg-gradient-to-br from-accent-muted via-surface to-info-lightest`

Content classes: `mx-auto flex max-w-7xl flex-col items-center px-6 py-16 text-center sm:py-20 lg:px-10 lg:py-24`

Primary action classes: `inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-overlay-dark px-5 py-2 text-sm font-medium text-surface transition-colors hover:bg-text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`

Secondary action classes: `inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-5 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`

### HowItWorks

Path: `components/homepage/HowItWorks.tsx`

Root classes: `mx-auto grid max-w-7xl border-x border-border bg-surface sm:grid-cols-2`

Content classes: `flex flex-col justify-center p-8 sm:p-12 lg:p-16`

Visual classes: `flex items-center justify-center border-t border-border bg-background p-8 sm:border-l sm:p-12 lg:p-16`

### Features

Path: `components/homepage/Features.tsx`

Root classes: `mx-auto grid max-w-7xl border-x border-border bg-surface sm:grid-cols-2`

Content classes: `flex flex-col justify-center border-t border-border p-8 sm:p-12 lg:p-16`

Visual classes: `flex items-center justify-center border-t border-border bg-background p-8 sm:order-first sm:border-r sm:p-12 lg:p-16`

### Testimonial

Path: `components/homepage/Testimonial.tsx`

Root classes: `mx-auto max-w-7xl border-x border-border bg-surface px-6 py-20 text-center sm:px-10 sm:py-24`

### LoginForm

Path: `components/auth/LoginForm.tsx`

Root classes: `w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm sm:p-10`

Provider button classes: `flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60`

Primary provider button classes: `flex min-h-11 w-full items-center justify-center rounded-md bg-overlay-dark px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60`

### ProfileForm

Path: `components/profile/ProfileForm.tsx`

Page layout classes: `flex-1 bg-background` with centered content `mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10`

Card classes: `rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6`

Input classes: `min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-text-primary shadow-sm outline-none transition-colors placeholder:text-text-muted hover:border-border-muted focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-secondary`

Primary action classes: `inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`

Secondary action classes: `inline-flex min-h-11 items-center justify-center rounded-md bg-accent-light px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`

Extraction panel classes: `flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent-light px-4 py-4 sm:flex-row sm:items-center sm:justify-between`

Resume generation action uses the primary action classes and exposes `Generating Resume...`, `Resume Generated`, and `Generate Resume from Profile` states. Errors use `role="alert"`; successful generation uses `role="status"`.

Generated resume access uses a secondary styled link to `/api/resume/download` labeled `Open generated resume`.

### FindJobsPage

Path: `components/jobs/FindJobsPage.tsx`

Page layout classes: `flex-1 bg-background` with centered content `mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10`

Content cards: `rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6`

Jobs table: semantic `table` inside `overflow-x-auto`, with `border-b border-border` rows, `hover:bg-surface-secondary`, and score bar colors `bg-success`, `bg-info-medium`, or `bg-warning` by match score.

Pagination controls use `min-h-11` touch targets and the active page uses `border-accent/20 bg-accent-light text-accent`.
