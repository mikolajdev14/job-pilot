# Jobs UI context

- `FindJobsPage.tsx` owns the responsive `/find-jobs` mock screen for Feature 09, including local search controls, filters, sorting, score bars, table rows, empty state, and pagination.
- This screen intentionally uses mock data. Adzuna requests and InsForge persistence belong to Feature 10 and should stay outside the present UI component.
- Use the shared tokens in `app/globals.css`, the page patterns in `context/ui-registry.md`, and the existing `Navbar`.
- Keep the jobs table semantic and horizontally scrollable on narrow screens. Keep all interactive controls keyboard accessible.

_Drafted by /sync from the introducing change, worth a quick human pass._
