# Agent API context

- `find/route.ts` is the server only boundary for authenticated job discovery.
- Keep Adzuna credentials and the OpenAI key on the server. Scope every InsForge query and write to the authenticated user.
- A search creates one `agent_runs` record, saves discovered jobs and agent logs, and emits only the approved PostHog events.
- Use the shared `MATCH_THRESHOLD` constant from `lib/utils.ts`; never duplicate the threshold in another file.

_Drafted by /sync from the introducing change, worth a quick human pass._
