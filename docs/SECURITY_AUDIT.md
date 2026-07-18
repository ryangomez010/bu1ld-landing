# Security Audit

Status: source-level security audit for The Bu1ld Nexus.

## Implemented Controls

- Auth context and route guards distinguish unauthenticated users from members
  and administrators.
- Project lead and admin affordances are separated in UI and supporting library
  calls.
- Supabase SQL phases define role tables, project memberships, evidence review,
  applications, moderation/reporting, audit logs, and RLS policies.
- Client-side role mutation is constrained; profile update logic excludes role
  changes from ordinary member edits.
- File/avatar paths validate URL and image characteristics before storage use.
- Email, digest, and account deletion handlers expect server-only credentials.
- Same-origin checks, rate-limit helpers, text sanitization, password
  validation, UUID/email validation, and trusted Supabase URL checks exist in
  shared security utilities.
- Production copy regression tests protect against leaking setup instructions to
  end users.

## Release Security Checks

- Run `bun run supabase:verify` and `bun run supabase:rls` against the target
  Supabase project after applying every phase through `phase25.sql`.
- Run `bun run release:prod` with strict production environment variables.
- Confirm no `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or digest secret is
  present in any `VITE_` variable or bundled client output.
- Verify OAuth, password reset, and callback redirects on the production domain.
- Verify member, project lead, reviewer, moderator/admin, and unauthenticated
  denied states with separate accounts.
- Confirm storage buckets reject cross-user writes and unsupported file types.

## Residual Risks

- Live RLS behavior requires a real Supabase project; source review cannot prove
  the deployed database state.
- In-memory rate limiting is suitable for a single process/worker but should be
  moved to KV/Redis or database-backed counters if abuse pressure appears.
- Public claims require human evidence review; code can help gate fields but
  cannot verify the truth of organizational claims by itself.
