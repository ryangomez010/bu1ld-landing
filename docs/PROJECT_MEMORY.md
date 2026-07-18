# Project Memory

**Canonical context for The Bu1ld Nexus.** Read this at the start of every pass. Last updated: Pass 2, 2026-07-17.

## Mission

A serious research and startup institution website and member platform for ambitious students, researchers, engineers, and builders. The Bu1ld organizes work around rigorous ML research, real project execution, and governed public claims.

## Repository

- **Path:** `/Users/ryan/Downloads/the-bu1ld-nexus-main`
- **Resolved from:** `~/Downloads/bu1ld-landing` (absent) — see [WORKSPACE_PATHS.md](./WORKSPACE_PATHS.md)

## Users

| Persona         | Entry                                     | Goal                                                            |
| --------------- | ----------------------------------------- | --------------------------------------------------------------- |
| Visitor         | `/`, public routes                        | Understand institution, verify claims, convert to membership    |
| Applicant       | signup, onboarding, apply routes          | Create account, complete profile, apply to projects/programs    |
| Member          | dashboard, projects, papers, research     | Contribute, track applications, save content, collaborate       |
| Project lead    | `/projects/manage/*`, `/projects/new`     | Publish projects, review applications, manage team and evidence |
| Reviewer/mentor | institutional roles + contribution review | Review evidence (partial — lead-centric today)                  |
| Moderator/admin | `/admin`                                  | Content, members, claims, moderation, security                  |
| Operator        | external                                  | Supabase, secrets, deploy, cron, monitoring                     |

## Architecture (summary)

- **App:** TanStack Start, React 19, TypeScript, TanStack Router/Query, Tailwind, Radix/shadcn, Vite
- **Backend:** Supabase Auth, Postgres, RLS, Storage, SQL RPCs
- **Server APIs:** `api/email.ts`, `api/digest.ts`, `api/account-deletion.ts` (Vercel/Cloudflare compatible)
- **Deploy:** Cloudflare (primary CI deploy) or Vercel; `wrangler.jsonc` + GitHub Actions
- **Detail:** [ARCHITECTURE.md](./ARCHITECTURE.md), [DATA_MODEL.md](./DATA_MODEL.md)

## Research organization (six labs)

Code uses **labs** (not "divisions"). Defined in `src/data/institution.ts`:

1. `scientific-discovery` — Machine Learning for Scientific Discovery
2. `mathematical-intelligence` — Mathematical Approaches to Intelligence
3. `robotics` — Robotics and Autonomous Intelligence
4. `computational-finance` — Computational Finance and Economics
5. `real-world-ai` — Real-World Applications and Systems
6. `emerging` — Interdisciplinary & Emerging Projects

Public routes: `/labs/`, `/labs/$slug` (static curated content).

## Routes (58 files in `src/routes/`)

### Public (no guard)

`/`, `/labs/*`, `/programs-public`, `/competitions`, `/competitions/$slug`, `/publications`, `/people`, `/partnerships`, `/apply`, `/evidence`, `/terms`, `/privacy`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`

### Auth-only (RequireAuth)

`/onboarding`, `/account/security`

### Member (RequireMember)

`/dashboard`, `/profile`, `/members/*`, `/projects/*` (browse), `/applications/`, `/papers/*`, `/events/*`, `/programs/*`, `/research/*`, `/guides/*`, `/newsletter/*`, `/jobs/*`, `/search/`, `/notifications/`, `/saved/*`, `/invitations`, `/account/*`, `/lead/apply`

### Project lead (RequireProjectLead)

`/projects/new`, `/projects/edit/$slug`, `/projects/manage/*`

### Admin (RequireAdmin)

`/admin/` — tabs: overview, announcements, events, papers, programs, projects, claims, institutions, newsletter, jobs, guides, members, leads, bulk publish, moderation, audit, security

## Database

- **46 tables** verified by `scripts/verify-supabase.mjs`
- **Migrations:** `supabase/schema.sql` + `phase2.sql` … `phase30.sql`; consolidated in `FINAL_SETUP.sql`
- **Key domains:** profiles (+ availability/skills), member_roles, projects (+ weekly commitment, applications, memberships, milestones, contributions with assigned reviewers, experiments, deliverables, datasets, application questions), papers (+ venue/editorial), research_paths, events, programs, competitions, notifications, saved collections, institutional_claims, labs, admin audit
- **RLS:** ~100+ policies; anon public papers catalog (phase26); phase28 evidence-safe public milestone/contribution reads; phase30 column-scoped public project catalog; guarded SECURITY DEFINER RPCs including assigned-reviewer review
- **Apply:** `bun run supabase:apply` or paste `FINAL_SETUP.sql` (through phase30)

## Authentication

- Supabase email/password, GitHub/Google OAuth, password reset, email verification
- Implementation: `src/lib/auth.tsx`, callback at `/auth/callback`
- Rate limiting: `src/lib/auth-rate-limit.ts`
- **Requires live Supabase** — no demo auth without env vars

## Authorization

- Guards: `RequireAuth`, `RequireMember` (onboarding_completed), `RequireAdmin`, `RequireProjectLead`
- Roles: `profiles.role`, `member_roles` (administrator, project_lead, reviewer, lab_lead, etc.)
- `is_platform_admin()` unifies admin checks (phase25)
- Client cannot escalate roles; `protect_profile_role()` trigger

## Integrations

| Integration              | Status                                       | Files                                        |
| ------------------------ | -------------------------------------------- | -------------------------------------------- |
| Supabase Auth/DB/Storage | Code complete; live config owner-only        | `src/lib/supabase.ts`, `supabase/*`          |
| Resend email             | Handler complete; secrets owner-only         | `api/email.ts`, `src/lib/email.ts`           |
| Digest cron              | Handler complete; secrets owner-only         | `api/digest.ts`, `src/lib/digest-handler.ts` |
| Account deletion         | Handler complete; secrets owner-only         | `api/account-deletion.ts`                    |
| Cloudflare deploy        | CI workflow exists                           | `.github/workflows/deploy-cloudflare.yml`    |
| Analytics                | Adapter ready; needs `VITE_ANALYTICS_DOMAIN` | `src/lib/analytics.ts`                       |

## Environment variables

See `.env.example`. Required for production:

- **Public:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (or publishable key), `VITE_EMAIL_ENDPOINT`, `VITE_ACCOUNT_DELETION_ENDPOINT`
- **Optional public:** `VITE_ANALYTICS_DOMAIN`
- **Server-only:** `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DIGEST_API_SECRET`, `EMAIL_API_SECRET` (optional)
- **Verify-only:** `SUPABASE_DB_PASSWORD` or `SUPABASE_DB_URL`

Never prefix server secrets with `VITE_`.

## Working systems (code-verified)

- Local typecheck, lint, test (106), build, `release:check`
- Auth flows and route guards
- Member onboarding (availability, experience, desired roles), profile, directory
- Project CRUD, applications, lead review, memberships, milestones, contributions
- Project experiments, deliverables, datasets + manage workspace UI
- Papers, events, jobs, programs, newsletters (Supabase-backed)
- Public publications catalog (`/publications`)
- DB-backed labs (`/labs/*` + AdminLabsTab) with static fallback
- Admin console (incl. labs)
- Notifications, saved collections, search
- Paper analyzer; institutional claims; competitions (hybrid)
- Analytics adapter (no-op when unconfigured)
- Research path DB helpers + progress
- Demo seed fallback for local dev only

## Broken / blocked systems

- `release:prod` — blocked without live secrets (expected)
- Live RLS/schema verification — not run locally (owner)
- Competition submissions when catalog is seed-only
- Email/digest/deletion in production — need deployed endpoints + secrets

## Missing systems

- Full immutable experiment run/metric model (beyond experiment rows)
- Startup CRM
- Playwright E2E suite
- Distributed rate limiting
- Independent reviewer assignment workflow
- Monitoring/incident runbook

## Design constraints

- Production must not show setup instructions or seed fake data (`supabase-fallback.ts`)
- Public claims require evidence URL + admin review
- Seed content scanned for unsupported affiliation/customer/benchmark claims
- Labs prefer DB; static `institution.ts` is fallback for demo
- Guides are bundled static content in `src/content/guides/`

## Security constraints

- RLS on all user data tables; anon public papers catalog (phase26)
- RPCs revoke PUBLIC, grant authenticated only
- Same-origin checks on server handlers
- No service-role or Resend keys in client bundle
- File/avatar URL validation before storage use

## Frozen priorities

1. Live Supabase + secrets + FINAL_SETUP through phase30 apply (owner)
2. Role smoke tests (including assigned reviewer)
3. Browser E2E suite beyond route registry smoke
4. Experiment immutability / startup CRM

See [IMPLEMENTATION_QUEUE.md](./IMPLEMENTATION_QUEUE.md).

## Acceptance criteria

See [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md).

## Exact current status

**Governor Phases 1–3 complete locally; Phase 4 packaging.** 126 tests pass; typecheck, lint, smoke, build, and `release:check` PASS. Schema through phase30 in repo (public evidence archive, weekly commitment, public project catalog, and server-side project brief validation). Browser QA confirms public project discovery, safe signup handoff, and mobile navigation. Production gate blocked on owner credentials. Apply FINAL_SETUP through phase30 on staging before live use of new tables/RPCs.

## Next task

**Owner:** apply FINAL_SETUP through phase30 + secrets + `release:prod` + multi-account role smokes. **Cursor:** commit only when asked; otherwise optional credentialed browser E2E. See [CURRENT_PASS_CONTEXT.md](./CURRENT_PASS_CONTEXT.md).

## Related docs

| Doc                                          | Purpose                          |
| -------------------------------------------- | -------------------------------- |
| [AUDIT_MASTER.md](./AUDIT_MASTER.md)         | All audit issues with stable IDs |
| [EXECUTION_STATUS.md](./EXECUTION_STATUS.md) | Pass progress                    |
| [OWNER_ACTIONS.md](./OWNER_ACTIONS.md)       | Credentialed external steps      |
| [DECISION_LOG.md](./DECISION_LOG.md)         | Architectural decisions          |

Legacy docs preserved: `MASTER_AUDIT.md`, `SYSTEM_MAP.md`, `USER_FLOW_MAP.md`, etc.
