# 0002 Company Research Agent rationale

## Context

The product promise is to help a candidate prepare for a specific application, not merely to summarize a company. The research must connect the company to the saved job and to the candidate's actual profile. The project already chose Browserbase, Stagehand, GPT 4o, InsForge, and PostHog in its architecture and context files. The database already has a nullable JSONB field for the dossier, so a new persistence model would add cost without solving a current problem.

## Options considered

### Direct synchronous route

The UI calls one authenticated route and waits for the complete dossier. It is the smallest complete user journey and fits the existing app. Its risk is hosting timeouts when third party pages are slow.

### Asynchronous research run

The route creates a durable run, returns immediately, and the UI polls for a dossier. It handles long research better, but requires a status model, more UI states, and another lifecycle decision before this phase.

### Browser only summary

The agent returns extracted website evidence without candidate specific synthesis. It is simpler, but it fails the product goal of interview preparation tailored to the user.

## Rationale

The synchronous route is recommended for the first complete slice because it has the smallest operational surface and matches the existing button to dossier interaction. The hard bounds and fallback make the failure behavior explicit. Browserbase is evidence collection, not the source of truth for job or profile data. GPT 4o runs after the browser closes so provider cleanup is not coupled to the final persistence step.

The current schema has no dedicated research lock table. The existing JSONB column therefore carries a short lived running marker and the complete dossier. An owner scoped conditional update makes the normal concurrent claim atomic without adding a migration. A stale marker is reclaimable after 10 minutes, which handles a process that terminates after claiming. If this becomes a real long running workflow, the next design should add a dedicated research run state and move to an asynchronous API.

## References

- Project sources: `context/build-plan.md`, `context/architecture.md`, `context/library-docs.md`, `context/code-standards.md`, and `migrations/20260716172327_create-initial-schema.sql`.
- Browserbase Skills documentation: https://docs.browserbase.com/integrations/skills/introduction
- Browserbase MCP documentation: https://docs.browserbase.com/integrations/mcp/introduction
- Browserbase MCP: https://www.browserbase.com/mcp
- Browserbase MCP package: https://www.npmjs.com/package/%40browserbasehq/mcp
