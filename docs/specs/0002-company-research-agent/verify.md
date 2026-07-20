# Feature 13 verification

## Automated checks

- Validate the dossier schema rejects missing fields and non string array members.
- Mock an authenticated owner and confirm the route reads and updates only that user's job.
- Confirm cached dossiers skip Browserbase and GPT 4o.
- Confirm a Browserbase extraction failure still reaches GPT 4o fallback and closes the session.
- Confirm a GPT 4o failure returns `503`, writes an error log, and does not save an invalid dossier.
- Confirm a recent research log returns `429` without opening a new session.
- Confirm two simultaneous empty claims result in one provider run and one `429` response.
- Confirm an old running marker is reclaimed and a fresh marker is not.
- Confirm credentials, private hosts, unsafe redirects, Adzuna hosts, and off domain links are rejected.
- Confirm persistence is acknowledged before `company_researched` is captured, and analytics failure does not change a successful response.

## Manual browser checks

- Open a saved job details route at desktop width.
- Select Research Company and confirm the button announces a loading state.
- Confirm all nine dossier sections render after the response.
- Confirm source links open in a new tab and invalid source strings are not links.
- Force a failed request and confirm the error and retry controls are visible.
- Repeat the request after the dossier exists and confirm the UI returns the cached dossier quickly.
- Check the route at a narrow mobile width for no horizontal overflow.
- Confirm an abandoned running marker becomes retryable after the ten minute TTL.
