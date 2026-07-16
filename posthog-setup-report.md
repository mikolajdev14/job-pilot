# PostHog post-wizard report

The wizard completed a PostHog integration for JobPilot. It installed the browser and Node SDKs, configured local PostHog environment variables, initialized browser analytics in `instrumentation-client.ts`, enabled exception capture, and added an ingestion proxy through Next.js rewrites. OAuth initiation is captured client-side, while successful OAuth callbacks identify the authenticated person on the server and capture the confirmed authentication event after a flush.

| Event name | Description | File |
| --- | --- | --- |
| `oauth_sign_in_started` | Tracks when a visitor starts sign-in with a supported OAuth provider. | `components/auth/LoginForm.tsx` |
| `user_authenticated` | Tracks successful OAuth authentication after the provider callback completes. | `app/(auth)/callback/route.ts` |

## Next steps

- [Analytics basics (wizard) dashboard](https://eu.posthog.com/project/225700/dashboard/825530)

The event taxonomy was checked before insight creation. The two new custom events have not yet been received by PostHog, so no event-based insights were created. Complete an OAuth sign-in in a deployed or local environment, then add trends or a funnel using the events above.

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add the exact PostHog env var names added here to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or the bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs.

### Agent skill

An agent skill folder is available in the project under `.claude/skills/integration-nextjs-app-router`. It can guide future agent development with up-to-date PostHog integration approaches.
