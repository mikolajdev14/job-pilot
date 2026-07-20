# Jobs UI context

- `FindJobsPage.tsx` owns the responsive `/find-jobs` screen, including search controls, filters, sorting, score bars, table rows, empty state, and pagination.
- `JobDetailsPage.tsx` renders the owner scoped `/find-jobs/[id]` detail view, including match reasoning, skills, job description, the CompanyResearchCard, and external apply actions.
- `CompanyResearchCard.tsx` owns the client side research request and all dossier states. Keep the research endpoint and provider orchestration outside UI components.
- The screen starts with mock data for the Feature 09 shell, then replaces it with the authenticated Feature 10 response from `/api/agent/find`; Adzuna and InsForge orchestration stays outside the UI component.
- Job details are loaded by `lib/job-details-server.ts` on the server, with both job ID and authenticated user ID filters. Company research is requested only through `/api/agent/research` and receives an owner scoped initial dossier.
- Use the shared tokens in `app/globals.css`, the page patterns in `context/ui-registry.md`, and the existing `Navbar`.
- Keep the jobs table semantic and horizontally scrollable on narrow screens. Keep all interactive controls keyboard accessible.

_Drafted by /sync from the introducing change, worth a quick human pass._
