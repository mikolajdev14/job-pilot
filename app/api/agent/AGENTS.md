# Agent API context

- `find/route.ts` is the server only boundary for authenticated job discovery.
- Keep Adzuna credentials and the OpenAI key on the server. Scope every InsForge query and write to the authenticated user.
- A search creates one `agent_runs` record, saves discovered jobs and agent logs, and emits only the approved PostHog events.
- Use the shared `MATCH_THRESHOLD` constant from `lib/utils.ts`; never duplicate the threshold in another file.
- `research/route.ts` is the authenticated owner scoped boundary for the synchronous Company Research Agent. Keep Browserbase, Stagehand, and OpenAI credentials server only, validate the nine field dossier before persisting it, and preserve the running marker cleanup path.
- Company Research success responses expose the validated payload as `dossier`; the client must read that same field. Every `agent_logs` insert also requires the owning job's `run_id`.

_Drafted by /sync from the introducing change, worth a quick human pass._
