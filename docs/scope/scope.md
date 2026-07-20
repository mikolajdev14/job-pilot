# Scope: JobPilot

JobPilot helps technical job seekers find relevant roles, understand their match, and research companies before applying.

**Build approach:** Tracer Bullet (complete a thin path through each layer before adding depth).
**Workflow:** Full (build, verify, test, review, and document for data, privacy, and external service changes).

## At a glance

| # | Feature | Phase | Status |
|---|---|---|---|
| 1 | Homepage | Foundation | existing |
| 2 | Auth | Foundation | existing |
| 3 | PostHog Initialization | Foundation | planned |
| 4 | Database Schema | Foundation | in-progress |
| 13 | Company Research Agent | Job Details | in-progress |

## Phase 1 Foundation

### 1. Homepage · existing
Public landing page with the approved visual design and responsive layout.
**Done when:** the homepage renders the approved sections and uses the project's token system.

### 2. Auth · existing
InsForge OAuth login, callback handling, session refresh, and protected routes.
**Done when:** Google and GitHub login establish a session and protected routes redirect unauthenticated users.

### 3. PostHog Initialization
Initialize analytics for the application before feature events are added.
**Done when:** browser and server PostHog clients are configured and the root layout identifies and resets users at the agreed lifecycle points.
- [ ] Design it (spec): `/architect PostHog Initialization`

### 4. Database Schema · in-progress
Create the durable InsForge data foundation for profiles, searches, jobs, agent logs, and active resumes.
**Done when:** the four tables, constraints, RLS policies, indexes, and private resume bucket are live and verified for owner isolation and recovery.
- [x] Design it (spec): `/architect Database Schema`
- [x] Build it: `/develop Database Schema`
   - [x] Schema and integrity: tables, fields, relationships, checks, cascades, and triggers (AC-1, AC-2, AC-3, AC-6)
   - [x] Ownership and RLS: grants, application policies, Storage object policies, and append only logs (AC-4, AC-5, AC-6)
   - [x] Apply and verify: migration, bucket configuration, live schema inspection, isolation checks, and recovery checks (AC-4, AC-5, AC-6, AC-7)
- [ ] Verify it: `/check verify Database Schema`
- [ ] Test it: `/test Database Schema`
Spec [0001](../specs/0001-database-schema/index.md) · code in `migrations/`

### 13. Company Research Agent · in-progress

Research a saved job's company, combine public company evidence with the saved job and candidate profile, and render a tailored interview dossier.
**Done when:** the authenticated research flow safely gathers public company evidence, persists a valid nine field dossier, renders all states, and passes verification and tests.
- [x] Design it (spec): [0002](../specs/0002-company-research-agent/index.md)
- [x] Build it: /develop Company Research Agent
   - [x] Research agent and provider lifecycle: Browserbase, Stagehand, safe URLs, fallback synthesis, and cleanup (AC-2, AC-3, AC-4, AC-5)
   - [x] API and persistence: auth, atomic claim, dossier validation, owner scoped update, stable errors, and observability (AC-1, AC-6, AC-8, AC-9)
   - [x] Research card: loading, error, retry, cached state, and all dossier sections (AC-7)
   - [ ] Verification coverage: provider mocks, security, concurrency, cleanup, and analytics ordering (AC-1 through AC-9)
- [ ] Verify it: /check verify Company Research Agent
- [ ] Test it: /test Company Research Agent

## Deferred

Later product phases remain tracked in `context/build-plan.md` until they are enrolled here.

## Legend

`existing` means the feature predates this workflow. `in-progress` means the feature has a decision and is being built. `planned` means it is queued.
