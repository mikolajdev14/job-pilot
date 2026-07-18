# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 3, Find Jobs Page
**Last completed:** 10 Adzuna Job Discovery
**Next:** 11 Filter + Sort + Pagination

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

- [ ] 12 Job Details Page — Full UI
- [ ] 13 Company Research Agent

### Phase 5 — Dashboard

- [ ] 14 Dashboard Page — Full UI
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
