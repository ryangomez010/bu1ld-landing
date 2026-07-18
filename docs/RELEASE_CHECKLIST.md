# Release Checklist

## Code gate

- [x] TypeScript typecheck passes locally.
- [x] Unit/security tests pass locally (117).
- [x] ESLint passes locally.
- [x] Production build passes locally.
- [x] Release copy/security gate passes locally (`release:check`).
- [x] Route registry smoke passes (`bun run smoke`).
- [x] Desktop/mobile layout reviewed against existing responsive shells (no separate Playwright suite yet).
- [ ] Current uncommitted source changes are reviewed, intentionally grouped,
      and committed when the owner requests a commit.

## Deployment gate

- [ ] Apply Supabase migrations through **`phase30.sql`** (use `FINAL_SETUP.sql` or sequential phases).
- [ ] Confirm `VERIFY_SETUP.sql` phases `(19)…(27)` and required tables.
- [ ] Configure Supabase site URL and redirect URLs.
- [ ] Configure production OAuth providers if enabled.
- [ ] Configure server-only `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Configure `RESEND_API_KEY`, `DIGEST_API_SECRET`, and email sender domain.
- [ ] Configure `VITE_EMAIL_ENDPOINT` / account-deletion endpoint as needed.
- [ ] Optional: `VITE_ANALYTICS_DOMAIN` for Plausible-style analytics.
- [ ] Run `bun run release:prod` in the deployment environment.

## Role smoke tests

- [ ] Visitor can inspect public research, papers, projects, programmes, events, evidence, and legal pages.
- [ ] New member can sign up, complete onboarding, edit profile, save items, and request project participation.
- [ ] Project lead can review requests, accept a member, assign a contribution reviewer, and review evidence.
- [ ] Assigned reviewer (non-lead) can verify / request changes only on assigned contributions.
- [ ] Member can submit, revise, and track contribution evidence.
- [ ] Admin can publish content, manage programmes, review claims, moderate reports, and inspect security records.
- [ ] Unauthorized users receive clear denied states and cannot access private data.

## Content release

- [ ] Unsupported affiliation, university, publication, project, and member-stat claims are removed or linked to evidence.
- [ ] Public copy stays specific to machine-learning research/building rather than generic community language.
- [ ] Finance4All/FinanceMeta differentiation is preserved.

## Production verdict

Do not mark public launch complete until code gate, deployment gate, role smoke
tests, and content release are all checked against the actual production target.

Local release candidate status: **code gate verified**; deployment and multi-account role tests remain owner-blocked.
