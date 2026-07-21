# UI Registry

This registry records the current shared visual patterns. Reuse these patterns before creating a new variant.

## Global shell

### Navbar

Path: `components/layout/Navbar.tsx`

Public header: `border-b border-border bg-background/90 backdrop-blur-xl`

Application header: the public header geometry with Dashboard, Find Jobs, and Profile always visible, an active route surface, and the Sign out action.

Active navigation link: `bg-surface-tertiary text-text-primary`

Inactive navigation link: `text-text-secondary hover:bg-surface hover:text-text-primary`

Mobile navigation: `order-3 flex w-full items-center justify-center gap-1 border-t border-border pt-2`

### Footer

Path: `components/layout/Footer.tsx`

Root: `border-t border-border bg-surface-muted`

Links: `rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary`

## Public screens

### Hero

Path: `components/homepage/Hero.tsx`

Composition: centered product badge, large headline, supporting copy, two actions, and a quiet ambient surface behind the content.

Primary action: `rounded-lg bg-accent text-accent-foreground hover:bg-accent-dark`

Secondary action: `rounded-lg border border-border-muted bg-surface text-text-primary hover:bg-surface-secondary`

### Homepage product panels

Paths: `components/homepage/Homepage.tsx`, `HowItWorks.tsx`, `Features.tsx`, `Testimonial.tsx`

Panel: `app-panel rounded-xl`

Selected information row: `border-border-muted bg-surface-tertiary`

Quiet information row: `border-transparent bg-surface-secondary`

Product screenshot: `dashboard-image rounded-lg`

### Login

Paths: `app/(auth)/login/page.tsx`, `components/auth/LoginForm.tsx`

Shell: `app-panel mx-auto grid min-h-screen max-w-7xl overflow-hidden rounded-xl`

Provider area: `rounded-xl border border-border bg-surface-secondary p-3`

Primary provider: `min-h-12 rounded-lg bg-accent text-accent-foreground`

Secondary provider: `min-h-12 rounded-lg border border-border-muted bg-surface`

## Application screens

### DashboardPage

Path: `components/dashboard/DashboardPage.tsx`

Page: `min-h-screen bg-background` with `max-w-7xl`.

The screen includes profile readiness, four statistic cards, a recent activity list, and three accessible Recharts surfaces. Statistics and activity come from owner scoped InsForge reads. Analytics come from a server only PostHog query and expose populated, empty, loading, and error states.

Dashboard data paths: `lib/dashboard-server.ts`, `lib/posthog-analytics.ts`

Dashboard components: `StatsBar.tsx`, `RecentActivity.tsx`, `AnalyticsCharts.tsx`

### ProfileForm

Path: `components/profile/ProfileForm.tsx`

Page: `min-h-screen bg-background` with `max-w-6xl`

Panel: `rounded-xl border border-border bg-surface shadow-card`

Field: `rounded-lg border border-border-muted bg-surface-secondary text-text-primary`

Primary action: `bg-accent text-accent-foreground hover:bg-accent-dark`

### FindJobsPage

Path: `components/jobs/FindJobsPage.tsx`

Page: `min-h-screen bg-background` with `max-w-7xl`

Search and filter controls use `bg-surface-secondary`, `border-border-muted`, and `focus:ring-accent/20`.

Results use a semantic table inside `overflow-x-auto`. The header uses `bg-surface-secondary`. Rows use `border-border` and `hover:bg-surface-secondary`.

### JobDetailsPage

Path: `components/jobs/JobDetailsPage.tsx`

Page: `min-h-screen bg-background` with `max-w-6xl`

Header, information cards, match reasoning, skills, description, and research all use `rounded-xl border border-border bg-surface shadow-card`.

### CompanyResearchCard

Path: `components/jobs/CompanyResearchCard.tsx`

Root: `overflow-hidden rounded-xl border border-border bg-surface shadow-card`

Loading uses `role="status"`. Errors use `role="alert"`. Empty, cached, retry, and all nine dossier sections remain visible and keyboard accessible.

## Shared rules

All primary buttons are light with dark text. All fields are darker inset surfaces. All pages expose one visible `h1`. Every focusable element has a two unit accent ring. No component contains a raw color literal or a built in Tailwind color class.
