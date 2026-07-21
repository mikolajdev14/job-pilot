# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 5, Dashboard
**Last completed:** 14 Dashboard Page, Full UI
**Next:** Verify and test Feature 13, then continue with real dashboard data

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [ ] 03 PostHog Initialization
- [ ] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [x] 06 Profile Save Logic
- [x] 07 AI Profile Extraction from Resume
- [x] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [x] 09 Find Jobs Page — Full UI
- [x] 10 Adzuna Job Discovery
- [ ] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [x] 12 Job Details Page — Full UI
- [x] 13 Company Research Agent — Build complete, provider and runtime verification remain

### Phase 5 — Dashboard

- [x] 14 Dashboard Page — Full UI
- [ ] 15 Stats Bar — Real Data
- [ ] 16 Recent Activity — Real Data
- [ ] 17 Analytics Charts — PostHog Data

---

## Decisions Made During Build

_Add decisions here as they are made during implementation._

---

## Notes

_Add notes here as the build progresses — workarounds, patterns, anything that differs from the context files._

- Auth uses the official `@insforge/sdk` SSR helpers: browser/server clients, auth Server Actions, OAuth callback route, refresh route, and `proxy.ts` route protection.
- 04 Database Schema is implemented in InsForge through migration `20260716172327_create-initial-schema.sql`, with four tables, RLS, Storage policies, indexes, constraints, triggers, and the private `resumes` bucket. Runtime verification and tests remain before marking it complete.
- 05 Profile Page is implemented as a responsive profile UI with local form interactions, tag editing, work-role addition, and resume PDF validation/drop handling.
- 06 Profile Save Logic uses a Server Action for owner-scoped profile upserts, deterministic resume storage at `{user_id}/resume.pdf`, completion calculation, and `/profile` revalidation.
- 07 AI Profile Extraction uses `pdf-parse` and server-only GPT-4o extraction, then fills the form for review before the user saves it.
- 08 Resume PDF Generation uses server-only GPT-4o content generation, `@react-pdf/renderer` with `renderToBuffer()`, and deterministic storage at `{user_id}/resume.pdf`; the generated URL is saved to `profiles.resume_pdf_url` and opened through the authenticated download route.
- 09 Find Jobs is implemented as a responsive UI with initial mock rows, local filters, sorting, score bars, source badges, empty state, and pagination.
- 10 Adzuna Job Discovery adds `/api/agent/find`, server side Adzuna search, GPT-4o scoring, owner scoped `agent_runs`, `jobs`, and `agent_logs` writes, and the required PostHog events. The Find Jobs screen consumes the returned matches.
- 12 Job Details adds the owner scoped `/find-jobs/[id]` server route, real job and match data, external job actions, responsive detail cards, and the Feature 13 company research empty state.
- 13 Company Research adds `/api/agent/research`, Browserbase and Stagehand evidence collection with safe URL checks, GPT 4o fallback synthesis, validated owner scoped persistence in `jobs.company_research`, and the complete dossier card with loading, error, retry, cached, and empty states.
- The application visual system now follows the supplied dark monochrome dashboard reference. Protected screens use a desktop sidebar and mobile navigation, while homepage, login, profile, job discovery, job details, loading, error, empty, and research states share the same charcoal panels and light actions.
- Dashboard is a separate full width route with top navigation. Find Jobs remains a dedicated search and results screen inside the work sidebar layout.
