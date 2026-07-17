# Release Checklist

## Code gate

- [x] TypeScript typecheck passes locally.
- [x] Unit/security tests pass locally.
- [x] ESLint passes locally.
- [x] Production build passes locally.
- [x] Release copy/security gate passes locally.
- [x] Desktop and mobile browser smoke check passes for public/auth routes.
- [ ] Current uncommitted source changes are reviewed, intentionally grouped,
      and tied to the release artifact.

## Deployment gate

- [ ] Apply Supabase migrations through `phase23.sql`.
- [ ] Configure Supabase site URL and redirect URLs.
- [ ] Configure production OAuth providers if enabled.
- [ ] Configure server-only `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Configure `RESEND_API_KEY`, `DIGEST_API_SECRET`, and email sender domain.
- [ ] Configure `VITE_EMAIL_ENDPOINT`.
- [ ] Run `bun run release:prod` in the deployment environment.

## Role smoke tests

- [ ] Visitor can inspect public research, papers, projects, programmes, events, evidence, and legal pages.
- [ ] New member can sign up, complete onboarding, edit profile, save items, and request project participation.
- [ ] Project lead can review requests, accept a member, and review contribution evidence.
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
