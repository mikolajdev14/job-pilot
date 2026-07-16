# 0001 Database schema

**Status**: In Progress

## Summary

This decision defines the first production database foundation for JobPilot. It stores profiles, search runs, jobs, agent logs, and active resumes in InsForge. The implementation uses one InsForge CLI migration, strict ownership rules, and a private storage bucket.

## Context

JobPilot needs durable storage before the profile, job discovery, company research, and dashboard features can write data. The data belongs to individual authenticated users and includes personal profile data, resumes, job history, and internal agent output.

The project already uses InsForge for authentication, database, and storage. Authentication creates the identity in `auth.users`, while application tables belong in the `public` schema. No team accounts, public job data, scheduled runs, or multiple resume versions are in scope.

> ⚠️ Premise note: Full account deletion crosses the database and storage boundaries. This spec defines database cascades and owner scoped storage paths, but a later account deletion action must remove the resume object because a database cascade cannot remove a Storage object.

## Requirements

As an authenticated job seeker, I need JobPilot to store my profile and resume safely, so later features can use them for matching.

As an authenticated job seeker, I need every search run, found offer, and agent log to be associated with me, so my history is isolated and useful.

As an authenticated job seeker, I need partial agent results to remain available when a run fails, so useful work is not lost.

AC-1. One migration creates the four application tables `profiles`, `agent_runs`, `jobs`, and `agent_logs` in `public`, with no demo or seed data.

AC-2. `profiles` supports a partially completed profile with `is_complete = false`, structured `work_experience` and `education` JSONB values, and an active resume reference.

AC-3. `agent_runs`, `jobs`, and `agent_logs` support the complete MVP flow, including `running`, `completed`, and `failed` runs, repeated job results, job research, and logs linked to a run and optionally a job.

AC-4. Every application table enforces ownership through `auth.uid()`. An anonymous client cannot read or write user data. An authenticated client can access only its own permitted rows, cannot change ownership, and cannot update or delete append only logs.

AC-5. The `resumes` bucket is private. A user can access only the object key `{user_id}/resume.pdf` inside that bucket, represented in the application as `resumes/{user_id}/resume.pdf`.

AC-6. Database constraints enforce valid status, source, log level, job type, experience values, nonnegative counts, and a `match_score` from `0` through `100`. Indexes support ownership filters, foreign key lookups, timestamps, status, score sorting, and research filtering.

AC-7. Applying the migration and bucket configuration is safe to verify and recover. A migration failure is atomic. If bucket creation fails after the migration succeeds, the schema remains and only bucket configuration is retried.

## Decision

Use one ordered InsForge CLI migration for all application tables, constraints, indexes, grants, RLS policies, Storage object policies, and integrity triggers. Create the private `resumes` bucket separately through the InsForge Storage CLI. Keep the application surface out of this feature. Later profile and agent features use the schema through the official InsForge SDK.

The schema uses direct `user_id` ownership on every user facing table. RLS compares that column with `auth.uid()`. `profiles.id` is both the profile primary key and the reference to `auth.users.id`. Job results are not globally deduplicated because each search result is part of the user's history.

The recommended implementation is one migration because it keeps the initial contract reviewable and applies atomically. The runner up is several smaller migrations, which would make isolated rollout easier but would create ordering and partial setup risk for this first foundation.

**Implementation skills**: `insforge-cli` (`InsForge/agent-skills`, `/Users/mikolaj/.agents/skills/insforge-cli/`) for migrations, database access control, integrity, and Storage setup · `insforge` (`InsForge/agent-skills`, `/Users/mikolaj/.agents/skills/insforge/`) for the official SDK ownership and database integration pattern · `insforge` Storage RLS reference (`/Users/mikolaj/.agents/skills/insforge/storage/postgres-rls.md`) for path scoped object policies

## Feature design

**Data model sketch**:

### `profiles`

| Column | Type | Required | Rules |
|---|---|---:|---|
| `id` | `uuid` | yes | primary key, foreign key to `auth.users(id)`, cascade on account deletion |
| `full_name`, `email`, `phone`, `location`, `current_title` | `text` | no | nullable profile fields |
| `experience_level` | `text` | no | `junior`, `mid`, `senior`, or `lead` |
| `years_experience` | `integer` | no | nonnegative |
| `skills`, `industries`, `job_titles_seeking`, `preferred_locations` | `text[]` | yes | default empty array |
| `work_experience` | `jsonb` | yes | default empty array, structured array with at most three entries |
| `education` | `jsonb` | no | nullable structured object |
| `remote_preference` | `text` | no | `remote`, `onsite`, `hybrid`, or `any` |
| `salary_expectation` | `text` | no | nullable |
| `cover_letter_tone` | `text` | no | `formal`, `casual`, or `enthusiastic` |
| `linkedin_url`, `portfolio_url`, `work_authorization`, `resume_pdf_url` | `text` | no | nullable |
| `is_complete` | `boolean` | yes | default `false` |
| `created_at`, `updated_at` | `timestamptz` | yes | database timestamps, `updated_at` maintained by trigger |

Each work experience object has the application contract `role`, `company`, `startDate`, `endDate`, `description`, and `technologies`. The education object has `degree`, `field`, `institution`, and `graduationYear`. The database enforces JSON type and the maximum array length. The application validates the object keys.

### `agent_runs`

| Column | Type | Required | Rules |
|---|---|---:|---|
| `id` | `uuid` | yes | primary key, generated by the database |
| `user_id` | `uuid` | yes | foreign key to `auth.users(id)`, cascade on account deletion, immutable |
| `status` | `text` | yes | `running`, `completed`, or `failed`, default `running` |
| `job_title_searched` | `text` | yes | input used for the search |
| `location_searched` | `text` | no | nullable search input |
| `jobs_found` | `integer` | yes | default `0`, nonnegative |
| `started_at` | `timestamptz` | yes | default current time |
| `completed_at` | `timestamptz` | no | nullable until completion or failure |

### `jobs`

| Column | Type | Required | Rules |
|---|---|---:|---|
| `id` | `uuid` | yes | primary key, generated by the database |
| `run_id` | `uuid` | no | foreign key to `agent_runs(id)`, `ON DELETE SET NULL` |
| `user_id` | `uuid` | yes | foreign key to `auth.users(id)`, cascade on account deletion, immutable |
| `source` | `text` | yes | `search` or `url` |
| `source_url`, `external_apply_url` | `text` | no | nullable URLs |
| `title`, `company` | `text` | yes | required offer identity |
| `location`, `salary`, `about_role`, `about_company`, `match_reason` | `text` | no | nullable descriptive fields |
| `job_type` | `text` | no | `fulltime`, `parttime`, or `contract` |
| `responsibilities`, `requirements`, `nice_to_have`, `benefits`, `matched_skills`, `missing_skills` | `text[]` | yes | default empty array |
| `match_score` | `integer` | no | nullable, from `0` through `100` |
| `company_research` | `jsonb` | no | nullable research dossier |
| `found_at` | `timestamptz` | yes | default current time |

There is no unique constraint on `source_url` or any other offer identity field. A repeated result is a new row linked to its current run. If `source = url`, `source_url` must be present.

### `agent_logs`

| Column | Type | Required | Rules |
|---|---|---:|---|
| `id` | `uuid` | yes | primary key, generated by the database |
| `run_id` | `uuid` | yes | foreign key to `agent_runs(id)`, cascade on account deletion |
| `user_id` | `uuid` | yes | foreign key to `auth.users(id)`, cascade on account deletion, immutable |
| `message` | `text` | yes | human readable log entry |
| `level` | `text` | yes | `info`, `success`, `warning`, or `error` |
| `job_id` | `uuid` | no | foreign key to `jobs(id)`, `ON DELETE SET NULL` |
| `created_at` | `timestamptz` | yes | default current time |

### Relationships and indexes

`auth.users` has one `profiles` row. One user has many runs, jobs, and logs. One run has many jobs and logs. One job can have many logs. A job linked to a run must have the same owner as that run. A log linked to a run or job must have the same owner, and a linked job must belong to the same run when that job has a run reference. Every foreign key and every direct ownership column is indexed. Additional indexes cover `(user_id, started_at)`, `(user_id, found_at)`, `(user_id, match_score)`, status, run lookups, log timestamps, and a partial research index where `company_research IS NOT NULL`.

**State transitions**:

`agent_runs.status` starts as `running` and can end as `completed` or `failed`. A failed run may retain jobs and logs already written. A completed run may also have zero jobs. Terminal states cannot transition again. `completed_at` is set when the run reaches either terminal state and remains unchanged afterward.

**API surface**:

This feature exposes no application HTTP endpoint or Server Action. It exposes two project administration commands and the database access surface consumed by later features.

| Surface | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| InsForge migration | `npx @insforge/cli db migrations up` | migration file, project link | applied migration and schema objects | project administrator | invalid SQL, wrong order, unavailable backend |
| InsForge Storage bucket | `npx @insforge/cli storage create-bucket resumes --private` | bucket name, private flag | private bucket | project administrator | bucket exists, invalid project, unavailable backend |
| Application table access | InsForge SDK CRUD in later features | authenticated user identity and feature payload | rows filtered by RLS | authenticated user | RLS denial, invalid constraint, missing foreign key |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Create profile | profile owner | `auth.uid()` and `profiles.id` |
| Create profile | completion state | database default `is_complete = false`, later derived from required profile fields by the profile feature |
| Save profile | profile fields | profile form or resume extraction output in the later profile feature |
| Start search | searched title and location | request fields from the Find Jobs feature |
| Start search | run identity and timestamps | database generated UUID and timestamps |
| Finish search | status, count, completion time | agent operation result and rows written to `jobs` |
| Save job | offer fields and match values | Adzuna response and GPT 4o matching output in the job discovery feature |
| Save research | dossier | Browserbase, Stagehand, job data, and profile data in the research feature |
| Save log | message, level, run, and optional job | agent operation and current authenticated user |
| Save resume | bucket and object key | bucket `resumes`, key authenticated user id plus fixed filename `resume.pdf` |
| Read any table row | accessible row set | RLS comparison between row ownership and `auth.uid()` |

**Key invariants**:

1. Every user facing row has a direct owner reference and cannot change ownership through an authenticated update.
2. Every insert and update policy has a matching `WITH CHECK` expression.
3. Anonymous clients have no data access.
4. `agent_logs` cannot be updated or deleted by authenticated clients.
5. A failed run keeps rows already written during that run.
6. A database account deletion cascades through application rows. Storage cleanup is handled by the later account deletion action.
7. The migration contains no transaction statements because InsForge wraps each migration in a transaction.
8. Schema changes use the `public` schema. The migration may add RLS policies to the explicitly supported managed table `storage.objects`, but does not modify other managed `auth` or `storage` objects.
9. Cross table ownership and run membership are checked by integrity triggers. A job cannot point to another user's run. A log cannot point to another user's run or job.
10. Run state transitions are enforced as `running` to `completed` or `failed` only. Terminal runs cannot be reopened.

**Security model**:

The roles are `anon`, `authenticated`, and `project_admin`. `anon` has no application data privileges. `authenticated` can select its own profile, runs, jobs, and logs, can insert rows with its own owner id, and can perform only the updates needed by the current feature contracts. It cannot alter owner fields. It cannot update or delete logs. Application tables use RLS policies with `auth.uid()` and direct `user_id` checks. The private `resumes` bucket uses `storage.objects` policies. For bucket `resumes`, `SELECT`, `INSERT`, `UPDATE`, and `DELETE` require `(storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub')` and `storage.filename(key) = 'resume.pdf'`. The object key is `{user_id}/resume.pdf`, so the first path segment is the authenticated user's subject. `project_admin` is used by migrations and CLI inspection, never by browser code.

The data includes personal information and resumes, so the implementation must follow the project's privacy obligations. No public projection is created and no user data is exposed to anonymous clients.

No new environment variables or third party credentials are required. The CLI uses the existing linked InsForge project configuration. Application code continues to use the existing `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` values.

**Critical test scenarios**:

1. Happy path: apply the migration, create the private bucket, inspect all four tables, indexes, grants, policies, and constraints, verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**, and **AC-6**.
2. Partial failure: create a failed run after inserting some jobs and logs, verify those rows remain and the run is terminal, verifies **AC-3**.
3. RLS isolation: use anonymous, owner, and different authenticated users to test select, insert, update, and log mutation access, verifies **AC-4** and **AC-5**.
4. Recovery: rerun an already applied migration and retry bucket setup after a simulated bucket failure, verifies **AC-7**.
5. Account deletion: delete a test auth user, verify database rows cascade and the account deletion flow removes the resume object, verifies **AC-4** and **AC-5**.

## Build plan

The project has no recorded build approach. This plan assumes a Tracer Bullet approach and starts with the database contract, then proves access control and storage before later features depend on it.

1. Create the ordered InsForge migration with the four tables, columns, defaults, foreign keys, checks, timestamp trigger, and ownership guards, satisfies **AC-1**, **AC-2**, and **AC-3**.
2. Add indexes, grants, RLS policies, append only log permissions, and immutable owner enforcement, satisfies **AC-4** and **AC-6**.
3. Create the private `resumes` bucket and owner scoped `storage.objects` policies for the exact `{user_id}/resume.pdf` key, satisfies **AC-5**.
4. Apply the migration and bucket configuration through the CLI, then inspect the live schema and run anonymous, owner, cross user, partial run, and recovery checks, satisfies **AC-4**, **AC-5**, **AC-6**, and **AC-7**.
5. Record the migration and storage conventions in project context after verification, satisfies **AC-7**.

## Consequences

**Positive**:

1. Data isolation is enforced in the database, not only in application filters.
2. The complete MVP flow has one stable schema before profile and agent code is built.
3. Failed agent runs remain explainable through retained jobs and append only logs.
4. The schema supports future URL imports without changing the source column.

**Negative and tradeoffs**:

1. One initial migration is larger and needs careful verification before later work begins.
2. Direct ownership on every table duplicates user references, but it makes RLS and list queries safer and faster.
3. Keeping every job result can create repeated rows and will require pagination and possible history cleanup later.
4. Storage cleanup cannot be handled by a database cascade and needs a later account deletion flow.

**Neutral**:

1. No resume metadata table is created. The database stores the active URL, while Storage owns the object metadata.
2. The `url` source value is supported in the schema but manual URL import remains out of scope.

## Follow-up

1. Implement account deletion so it removes the private resume object before or during auth user deletion.
2. Add the profile creation and completion rules to the Profile feature spec.
3. Run authenticated owner and cross user Storage checks during `/check verify` with test accounts.
4. Add pagination and retention decisions when job history volume becomes measurable.

## Rationale

Reasoning and alternatives are recorded in `rationale.md`.
