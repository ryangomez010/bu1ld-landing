# Implementation Plan

## Completed in the current production pass

- Removed developer setup language from production-facing auth/admin failure states.
- Disabled auth actions when the live auth client is unavailable.
- Added accessible evidence-register skeleton loading.
- Added production copy regression testing.
- Strengthened release gates for strict production configuration.
- Verified typecheck, tests, lint, production build, release gate, and browser smoke routes.

## Current Repository Constraint

The repository has many existing uncommitted source changes. Treat them as
user-owned work. Before release, inspect the full diff, split unrelated changes
if needed, and create a stable release branch or commit so the deployed artifact
matches the verified code exactly.

## Next code hardening sequence

1. Add role-specific integration tests for project lead, reviewer, moderator, and admin paths using seeded Supabase fixtures or a local Supabase instance.
2. Add browser E2E tests for signup, onboarding, project application, lead approval, contribution submission, contribution review, saved collections, and admin publishing.
3. Add claim-source validation in admin claim forms so verified claims require a source URL before publication.
4. Add pagination and explicit retry states to every admin list with potentially large result sets.
5. Add deployment monitoring hooks for email/digest/account deletion failures.
6. Add a disposable Supabase test project or local Supabase CI job for RLS and storage policy tests.
7. Add explicit not-found, denied, retry, and empty-state screenshots to the browser smoke pack for member and admin paths.

## External sequence

1. Apply migrations through `phase23.sql`.
2. Configure production secrets, email, OAuth, redirects, cron, and sender domain.
3. Run `bun run release:prod`.
4. Run manual role smoke tests with separate accounts.
5. Freeze public claims until source evidence has been checked.
