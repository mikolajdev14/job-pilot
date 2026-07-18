# Jobs UI context

- `FindJobsPage.tsx` owns the responsive `/find-jobs` screen, including search controls, filters, sorting, score bars, table rows, empty state, and pagination.
- The screen starts with mock data for the Feature 09 shell, then replaces it with the authenticated Feature 10 response from `/api/agent/find`; Adzuna and InsForge orchestration stays outside the UI component.
- Use the shared tokens in `app/globals.css`, the page patterns in `context/ui-registry.md`, and the existing `Navbar`.
- Keep the jobs table semantic and horizontally scrollable on narrow screens. Keep all interactive controls keyboard accessible.

_Drafted by /sync from the introducing change, worth a quick human pass._
