# Research agent context

- `research.ts` owns the server only company research workflow, including safe public URL selection, Browserbase and Stagehand lifecycle, evidence extraction, and GPT 4o dossier synthesis.
- Keep provider credentials in server environment variables. Browser evidence is optional, and synthesis must fall back when a public company URL cannot be safely opened.
- The route owns authentication, owner scoped database claims, persistence, stable API errors, and analytics ordering. The agent writes only best effort `agent_logs` events with `run_id`, `user_id`, and `job_id`.
- Validate every generated dossier with the shared schema in `lib/company-research.ts` before returning it to the application.

_Drafted by /sync from the introducing change, worth a quick human pass._
