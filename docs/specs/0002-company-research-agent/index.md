# 0002 Company Research Agent

**Status**: In Progress
**Date**: 2026-07-19

## Summary

Feature 13 lets an authenticated user research a saved job's company from the job details page. A server route uses one Browserbase session with Stagehand to inspect the company's public pages, then GPT 4o combines that evidence with the saved job and user profile to produce a dossier. The dossier is saved on the existing job row and shown in the research card.

## Context

JobPilot already stores matched jobs, candidate profiles, and an empty `company_research` JSON column in InsForge. Feature 12 already renders the empty research card, but its button has no behavior. This feature completes that user path without changing the profile, match score, or job discovery flow.

> ⚠️ Premise note: a synchronous request can approach a hosting function timeout while a Browserbase session runs. The selected design keeps one session, a 120 second Browserbase limit, a maximum of three sub pages, and a deterministic GPT fallback. If real usage shows timeouts, the next decision should split this into an asynchronous run and polling flow rather than adding more work to this request.

The feature is a new server and client slice on the existing Next.js application. It uses the existing InsForge authentication and row level security model. The project's delivery approach is Tracer Bullet, so the build plan creates one complete research path from the button through the route, agent, database write, and rendered dossier before adding depth.

## Requirements

### AC-1 Authenticated research request

When an authenticated user selects Research Company for a saved job, the browser sends `POST /api/agent/research` with the job ID. The route reads only the job and profile owned by the current InsForge user. If the profile row is missing, the route returns `400` with code `PROFILE_REQUIRED` and does not open a provider session.

### AC-2 Cached dossier

If the selected job already has a valid `company_research` dossier, the route returns it with `cached: true` and does not open Browserbase or call GPT 4o.

### AC-3 Company source discovery

For a job without research, the agent follows the job's external or source URL with server side `fetch` and derives a company homepage from the final HTTPS URL. If that fails or remains on Adzuna, it derives `https://www.{company-slug}.com` from the stored company name. The browser must only visit the selected homepage and same domain links.

### AC-4 Browser research

The agent opens exactly one Browserbase session with a 120 second timeout. Stagehand uses GPT 4o, extracts structured homepage evidence, then visits at most three useful same domain pages, preferring about, blog, engineering, product, team, and careers pages in that order. Every browser operation is guarded and the session closes in a `finally` path.

### AC-5 Deterministic fallback

If URL discovery, Browserbase, Stagehand, or page extraction fails, the agent logs the failure and still sends the stored job, profile, and any partial research to GPT 4o. The browser is optional evidence. The final GPT response must be a complete dossier unless GPT 4o itself is unavailable or returns invalid data.

### AC-6 Dossier synthesis and persistence

GPT 4o returns valid JSON with all nine dossier fields: `companyOverview`, `techStack`, `culture`, `whyThisRole`, `yourEdge`, `gapsToAddress`, `smartQuestions`, `interviewPrep`, and `sources`. The route validates the shape, saves it to `jobs.company_research` using both job ID and user ID filters, and returns it to the browser.

### AC-7 Research card states

The job details card shows the idle empty state, a disabled loading state, a human readable error state with retry, and the complete dossier. The dossier renders all nine fields, including source links when the returned source is a valid HTTPS URL.

### AC-8 Repeat request protection

Completed research is served from cache. A new research attempt claims the existing `company_research` column atomically by writing a short lived pending marker. A second request returns `429` while the marker is fresh. A marker older than 10 minutes is stale and may be reclaimed. A throttled request does not open a new browser session.

### AC-9 Observability

The agent writes human readable start, browser failure, synthesis failure, persistence failure, and success records to `agent_logs` with the current user and job IDs. A newly generated dossier emits the existing `company_researched` PostHog event with `userId`, `jobId`, and `company`. Cached responses do not emit a second research event.

## Decision

Use a synchronous authenticated Node.js Next.js route backed by a small server only research agent. The route has a 105 second internal deadline, while the single Browserbase session has a 120 second expiry. The deployment must provide enough request time for the selected synchronous path. Keep Browserbase and OpenAI credentials in environment variables. Use the official `@browserbasehq/sdk`, `@browserbasehq/stagehand`, and `zod` packages directly. Reuse InsForge for authentication, database reads, database writes, row level security, and agent logs.

The route performs the work in this order: authenticate, validate, load the owner scoped job and profile, return a valid cached dossier when present, atomically claim the empty or stale research slot, resolve a safe homepage, run one sequential Browserbase session, close the browser, synthesize with GPT 4o, validate the dossier, persist it, log success, capture analytics, and return the dossier. If browser work fails, synthesis continues with the job and profile alone. If synthesis fails, the route clears the pending marker, returns a generic `503`, and leaves the empty state available for retry. Analytics and best effort logging never turn a confirmed database write into a client error.

**Implementation skills**: `insforge` (`/Users/mikolaj/.agents/skills/insforge/`) for server side auth and database access · `browser:control-in-app-browser` (`/Users/mikolaj/.codex/plugins/cache/openai-bundled/browser/26.707.62119/`) was requested for visual verification, but its execution tool is unavailable in this session

## Feature design

**Data model sketch**:

| Entity | Key fields | Relationship and constraints |
|---|---|---|
| `profiles` | `id` required, profile fields required or nullable according to the existing schema | one profile belongs to one auth user, read only for this agent |
| `jobs` | `id` required, `user_id` required, job source fields, `company_research` nullable JSONB | one user has many jobs, the agent updates only `company_research` on an owner scoped row. The value is either null, a pending marker `{ status: "running", startedAt: ISO string }`, or a complete dossier. |
| `agent_logs` | `id`, `user_id`, nullable `job_id`, `message`, `level`, `created_at` | one job may have many append only logs, used for audit and recent attempt protection |

No migration is required. The dossier and its short lived claim marker use the existing `jobs.company_research` column. The claim is an owner scoped conditional update from null to the running marker. The agent never changes `profiles`, `match_score`, `match_reason`, or job source fields.

**State transitions**:

The research value has three application states: `empty`, `running`, and `complete`. `running` is persisted as a marker with a start time so the database can prevent duplicate provider work. A fresh marker is throttled. A marker older than 10 minutes is stale and may be reclaimed. A completed log record and a non null valid dossier are the durable evidence of completion. A controlled failure clears the marker back to null. A process termination may leave a marker, but the TTL makes it recoverable.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/agent/research` | POST | `jobId:string`, required | `success`, `dossier`, `cached` | authenticated InsForge session | `400` invalid JSON or missing profile, `401` unauthenticated, `404` not owned or missing, `429` fresh claim with `Retry-After`, `503` provider or synthesis timeout, `500` persistence or unexpected failure |

The endpoint always uses the response wrapper `{ success: boolean, dossier?: CompanyResearchDossier, cached?: boolean, error?: { code: string, message: string } }`. Invalid JSON maps to `INVALID_JSON`, unsupported content type to `UNSUPPORTED_CONTENT_TYPE`, missing profile to `PROFILE_REQUIRED`, invalid cached JSON to a logged recovery path, unsafe or unusable URLs to `UNSAFE_SOURCE`, a fresh claim to `RESEARCH_IN_PROGRESS`, provider or deadline failure to `RESEARCH_UNAVAILABLE`, and persistence failure to `PERSISTENCE_FAILED`. A `429` response includes `Retry-After: 600`. Raw provider errors, keys, URLs with credentials, and stack traces never reach the browser. A successful database write is returned as success even when optional analytics or log delivery fails.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Validate request | `jobId` | JSON body, validated as a non empty string |
| Authorize request | current `userId` | InsForge session from `createInsforgeServer()` |
| Load job | title, company, URLs, description, matched skills, missing skills | owner scoped `jobs` row |
| Load profile | current title, experience, skills, industries, and work history | owner scoped `profiles` row |
| Resolve homepage | final URL | server side redirect following from `external_apply_url`, then `source_url`, with HTTPS, public host, no credentials, no nonstandard port, and a short fetch timeout |
| Resolve fallback homepage | fallback URL | sanitized `jobs.company` value and the fixed `https://www.{slug}.com` rule, used only after the same public host checks |
| Browser evidence | overview, product summary, signals, same domain page links, technologies, culture, notable facts | Stagehand structured extraction from public company pages |
| Synthesis | nine dossier fields | GPT 4o using browser evidence, saved job data, and saved profile data, with model `gpt-4o`, JSON response mode, temperature `0.4`, and an 800 token ceiling |
| Cache response | `dossier`, `cached:true` | validated existing `jobs.company_research` JSONB |
| Persist dossier | updated `company_research` | owner scoped `jobs` update by `id` and `user_id` |
| Research card | loading, error, retry, and dossier sections | server supplied initial dossier plus API response and local client state |
| Source links | external source hrefs | dossier `sources`, which must be HTTPS URLs from the collected same domain page list; otherwise render source text without a link |

**Dossier contract**:

| Field | Type and validation | Empty behavior |
|---|---|---|
| `companyOverview` | required string, trimmed, maximum 1600 characters | empty string allowed when evidence is thin |
| `techStack` | string array, maximum 20 items, each maximum 120 characters | empty array |
| `culture` | string array, maximum 12 items, each maximum 500 characters | empty array |
| `whyThisRole` | required string, trimmed, maximum 1200 characters | empty string allowed when the job gives no signal |
| `yourEdge` | string array, maximum 12 items, each maximum 500 characters | empty array |
| `gapsToAddress` | string array, maximum 12 items, each maximum 500 characters | empty array |
| `smartQuestions` | string array, maximum 12 items, each maximum 500 characters | empty array |
| `interviewPrep` | string array, maximum 12 items, each maximum 500 characters | empty array |
| `sources` | string array, maximum 10 HTTPS URLs, each maximum 2048 characters | empty array |

Cached JSON is valid only when it passes this complete schema. Invalid cached JSON is treated as empty, logged with `invalid_cached_dossier`, and replaced after a new claim.

**Browser evidence contract**:

Homepage extraction returns `oneLiner:string`, `productSummary:string`, `signals:string[]`, and `pageLinks:{ url:string, kind:"about"|"careers"|"blog"|"engineering"|"product"|"team"|"other" }[]`. Each sub page extraction returns `keyPoints:string[]`, `technologies:string[]`, `valuesOrCulture:string[]`, and `notable:string[]`. Page links are normalized, deduplicated, filtered to the selected site, and ranked by the fixed preference order. At most three are visited.

**Key invariants**:

1. Every database read and write is scoped by the authenticated `user_id`.
2. A valid dossier always contains all nine fields with strings or string arrays in the agreed shape.
3. Browser evidence is optional, but a non cached successful response always comes from GPT 4o synthesis.
4. One research request uses one Browserbase session and never runs sub page visits in parallel.
5. A Browserbase session is closed even when initialization, navigation, extraction, synthesis, or persistence fails.
6. The browser never follows links outside the selected company domain.
7. Profile data is read but never modified by company research.
8. Cached requests do not spend Browserbase or GPT 4o credits and do not duplicate the PostHog research event.
9. The running marker claim is conditional on `company_research IS NULL` or a stale marker, so normal simultaneous requests do not both start provider work. A process that dies after a claim is recoverable after 10 minutes.

**Provider lifecycle**:

The route uses the Node runtime, starts a Browserbase session with project ID and a 120 second expiry, then initializes Stagehand with `openai/gpt-4o`. Every `goto`, `extract`, and link selection is inside its own guarded operation. If Stagehand initialized, `stagehand.close()` runs in `finally`; cleanup errors are logged and do not replace the original failure. If initialization fails, no Stagehand call is attempted and the session is treated as unavailable. Server fetches use a five second redirect timeout and the overall route stops provider work at 105 seconds.

**Stable observability events**:

The agent_logs.message values are stable event names: `research_started`, `research_cached`, `research_browser_failed`, `research_synthesis_failed`, `research_persistence_failed`, `research_succeeded`, `research_invalid_cached_dossier`, and `research_rate_limited`. Each row includes `user_id`, `job_id`, a level from `info`, `success`, `warning`, or `error`, and a sanitized reason in the message detail. Log writes are best effort. The PostHog event fires only after the update returns one confirmed owner scoped row. PostHog failure is logged and does not change the successful response.

**Client state behavior**:

The server page passes a valid initial dossier or null to a client research card. The button is disabled during the request, duplicate clicks are ignored, the request is aborted on unmount, and a response is applied only while the card is mounted. A `429` displays the safe message and the retry wait. Empty strings and arrays render an honest No information available state. Source strings are displayed as text unless they pass HTTPS and same site validation; valid sources use a new tab with `rel="noreferrer"`.

**Security model**:

Only an authenticated user can call the route. The route obtains identity from the InsForge server session and applies `user_id` filters to the jobs, profiles, and agent logs queries. RLS remains the second enforcement layer. Browserbase and OpenAI credentials are server only. Redirect resolution accepts only HTTPS final URLs, rejects credentials, nonstandard ports, localhost, loopback, link local, private IP literals, private DNS resolutions, and Adzuna hosts as company sources. The root site is the normalized final two host labels, with known public suffix pairs such as `co.uk`, `com.au`, `co.nz`, `co.jp`, `com.br`, and `co.in` handled as one suffix. Stagehand may visit the root host and its subdomains only, never a different registrable site. A guessed fallback domain is treated as untrusted evidence and can be skipped when validation fails. Dossier content is derived from public company pages plus the user's own profile and job data, and provider errors are mapped to safe user facing messages.

**Configuration required**:

- `RUNTIME`: Node.js route runtime, not Edge, because the provider SDKs require Node APIs
- `RESEARCH_DEADLINE_MS`: fixed application budget of 105000 milliseconds, not user configurable in production
- `BROWSERBASE_API_KEY`: server only Browserbase API credential
- `BROWSERBASE_PROJECT_ID`: Browserbase project used for one research session
- `OPENAI_API_KEY`: server only GPT 4o and Stagehand model credential
- `NEXT_PUBLIC_INSFORGE_URL`: existing InsForge base URL
- `NEXT_PUBLIC_INSFORGE_ANON_KEY`: existing InsForge user scoped key
- `NEXT_PUBLIC_POSTHOG_KEY`: existing server analytics key
- `NEXT_PUBLIC_POSTHOG_HOST`: existing PostHog host

**Critical test scenarios**:

- Happy path: authenticated user researches a job, Browserbase returns evidence, GPT 4o returns a valid dossier, the dossier is saved and rendered, verifies AC-1, AC-4, AC-6, AC-7, AC-9
- Cached path: a valid dossier is returned without provider calls, verifies AC-2 and AC-8
- Browser failure: browser evidence fails, the session closes, GPT 4o synthesizes from job and profile data, verifies AC-5
- Synthesis failure: GPT 4o is unavailable, the route returns `503`, logs the failure, and the UI offers retry, verifies AC-5 and AC-7
- Invalid and unauthorized access: invalid input returns `400`, no session returns `401`, and another user's job returns `404`, verifies AC-1 and the Security model
- Recent attempt: a second request within the cooldown returns `429` without opening a new session, verifies AC-8

## Build plan

1. Add the direct Browserbase SDK, Stagehand, Zod, and the existing OpenAI dependency, create the complete dossier schema, research marker schema, and Node only provider helper. Satisfies AC-4, AC-6, AC-8.
2. Build the company research agent. Add safe URL resolution with DNS and host checks, owner scoped data loading, complete cache validation, atomic running marker claim with stale TTL, structured homepage and sub page extraction, guaranteed session cleanup, GPT 4o fallback synthesis, and safe error logging. Satisfies AC-2, AC-3, AC-4, AC-5, AC-8, AC-9.
3. Add `POST /api/agent/research` with content type and body validation, authentication, profile handling, owner scoped persistence that confirms one updated row, response wrappers, stable error codes, PostHog event capture after persistence, and best effort log handling. Satisfies AC-1, AC-6, AC-8, AC-9.
4. Wire the existing company research card to a client component. Pass an initial validated dossier from the server, add loading, error, retry, throttle, duplicate click protection, abort on unmount, cached response handling, and all nine dossier sections with safe source links. Satisfies AC-7.
5. Verify the complete flow with provider mocks, owner isolation cases, cache behavior, atomic claim and stale recovery, cleanup on failure, URL safety cases, error wrappers, analytics ordering, lint, TypeScript, production build, and a browser check when the in app browser tool is available. Satisfies AC-1 through AC-9.

## Consequences

The first version is simple to understand and does not add a job queue or a new research table. It may still approach a hosting timeout for slow sites, so the one session and three page limits are hard. Research quality depends on the public pages reachable from the final job URL. The fallback keeps the user path useful but can produce a less specific dossier. A future asynchronous run model can be added if measured timeout or concurrency data justifies it.

## Follow-up

- [ ] Add a dedicated Browserbase or Stagehand community skill if the project wants agent guidance beyond the official package documentation.
- [ ] Consider an asynchronous research run and persisted status if synchronous requests show timeout or concurrency problems.
- [ ] Consider enrolling Feature 13 in `docs/scope/scope.md`; it currently remains tracked in `context/build-plan.md` only.

## Rationale

Reasoning and options: see `rationale.md`.
