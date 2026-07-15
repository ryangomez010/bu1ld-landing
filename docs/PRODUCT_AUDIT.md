# Product Audit

Status: active development / near-launch audit for The Bu1ld Nexus.

The Bu1ld is a role-aware machine-learning research and building platform. It is
not a Finance4All/FinanceMeta subproduct and should keep its own brand, user
model, Supabase project, content policy, and release process.

## Supported Product Scope

- Public discovery: landing, research, papers, projects, programmes, events,
  guides, jobs, newsletter, public evidence register, privacy, and terms.
- Membership: sign-up, login, password recovery, onboarding, dashboard, profile,
  saved items, collections, notifications, applications, account settings, and
  activity/security pages.
- Research/project operations: project creation, project management,
  applications, member collaboration, updates, contribution evidence, review,
  and public evidence records.
- Administration: content management, members, claims, moderation,
  audit/security records, programmes, events, guides, papers, jobs, projects,
  newsletters, and bulk publishing.

## Verified Strengths

- Routes and components cover visitor, applicant, new member, active member,
  project lead, reviewer/mentor, moderator, administrator, and operator duties.
- Supabase schema phases through `phase22.sql` address roles, project
  memberships, application windows, contribution evidence, publication review,
  content governance, and public evidence.
- Auth surfaces use production-safe unavailable messaging instead of raw setup
  instructions.
- Server/API handlers exist for email, digest delivery, and account deletion
  with server-only secret expectations.
- Release tooling includes typecheck, unit/security tests, lint, production
  build, audit, Supabase verification scripts, and strict release readiness.

## Risks To Resolve Before Public Launch

- The repo currently has broad uncommitted source changes. Review and commit or
  split them before treating a release artifact as stable.
- Live RLS, storage, email, digest, OAuth, redirects, and account-deletion flows
  cannot be fully proven from source without the production Supabase project and
  secrets.
- Public claims, member counts, affiliations, project outcomes, and evidence
  records must remain unpublished unless source evidence is attached and
  reviewed.
- `wrangler.jsonc` includes a public Supabase anon configuration. That is not a
  secret, but it must point only at the intended public project and never be
  confused with a service-role key.

## Verdict

The Bu1ld is a strong near-launch product with a deeper research/project
workflow than Finance4All. It should proceed through its own release gate after
the current uncommitted work is reviewed and live Supabase verification passes.
