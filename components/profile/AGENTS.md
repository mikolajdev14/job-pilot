# Profile UI context

- `ProfileForm.tsx` owns the responsive profile screen UI and submits typed values through `actions/profile.ts`.
- `actions/profile.ts` is the server only boundary for profile persistence and resume uploads. Keep InsForge calls out of the client component.
- Use the shared tokens from `app/globals.css` and the existing card, input, and action patterns recorded in `context/ui-registry.md`.
- Resume selection, extraction, and the server actions are limited to PDF files up to 5MB. Extraction uses the server only `OPENAI_KEY` configuration and never exposes the key to the client.
- Resume generation lives in `app/api/resume/generate/route.ts`; OpenAI and `@react-pdf/renderer` stay server side, and the generated PDF is uploaded to the private `resumes` bucket.
- Generated resumes are opened through `app/api/resume/download/route.ts`, which checks the signed in user before downloading `{user_id}/resume.pdf`.
- The route is `app/profile/page.tsx`, and protected route behavior is owned by the root `proxy.ts`.

_Drafted by /sync from the introducing change, worth a quick human pass._
