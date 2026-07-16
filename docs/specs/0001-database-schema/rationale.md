# 0001 Database schema rationale

## Context

JobPilot is a small Next.js application using InsForge as its managed Postgres backend, authentication service, and file storage. The first data layer must support a single authenticated user, four related application datasets, one active resume, and later agent workflows. The project has no team isolation, public data, or measured scale problem.

The schema will be applied before the profile, job discovery, research, and dashboard features write data. It therefore needs a clear ownership model, safe partial failure behavior, and a repeatable setup path that does not depend on application code being finished.

## Options considered

### One InsForge CLI migration and one private bucket

This is the chosen option. It keeps the initial schema contract together, lets InsForge apply the SQL atomically, and uses the platform's native Storage setup. The cost is a larger first migration and one verification pass across database and Storage.

### Manual SQL through `db query`

This would be quick for a small change and useful for targeted repairs. It is the wrong default for the initial schema because it is easier to lose ordering, repeat commands accidentally, or leave setup undocumented.

### External migration tooling

An external tool could provide a familiar migration workflow and local database features. It adds another dependency and source of truth while InsForge already provides ordered migrations, project linkage, and schema cache refresh.

### Several smaller initial migrations

Splitting tables, policies, and indexes could make each file shorter. It also creates more intermediate states and makes a first time setup harder to reason about. The current project benefits more from one reviewable foundation.

## Rationale

The relational model matches the domain because profiles, runs, jobs, and logs have explicit ownership and parent child relationships. Direct `user_id` columns make RLS policies simple and avoid cross table policy recursion. The platform's native migration and Storage commands keep infrastructure changes close to the backend that runs them.

The design accepts repeated job rows because the product needs a history of search results and the current model has one `run_id` per job. Deduplicating later would require a separate many to many history model, so it is intentionally not introduced before the product needs it. Partial run persistence is also deliberate because losing already scored jobs during a later failure would make the agent less useful and harder to diagnose.

The main operational tradeoff is that database cascades do not remove Storage objects. The follow up account deletion flow must explicitly remove the user resume object. This is safer than pretending that a foreign key provides full account erasure. Storage access is still enforced in `storage.objects` through a path scoped policy, so application filters are not the security boundary.
