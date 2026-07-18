# Audit Master

Pass 1 audit register. Every issue has a stable ID. Status enum: `UNRESOLVED`, `PARTIAL`, `RESOLVED`, `INVALIDATED`, `DEFERRED`, `BLOCKED`.

Last updated: 2026-07-17 (Pass 1)

---

## Launch blockers (owner / live environment)

### AUD-001 — Strict production release gate blocked

| Field          | Value                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity       | Critical                                                                                                                                    |
| Status         | BLOCKED                                                                                                                                     |
| Affected files | `scripts/release-readiness.mjs`, `.env`                                                                                                     |
| Impact         | Cannot claim production-ready; `release:prod` exits 1                                                                                       |
| Root cause     | Missing `SUPABASE_DB_PASSWORD`/`SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DIGEST_API_SECRET`, `VITE_EMAIL_ENDPOINT` |
| Fix            | Owner configures deployment secrets per `OWNER_ACTIONS.md`                                                                                  |
| Validation     | `BU1LD_RELEASE_STRICT=1 bun run release:prod` passes                                                                                        |

### AUD-002 — Live Supabase schema verification not executed

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Severity       | Critical                                                             |
| Status         | BLOCKED                                                              |
| Affected files | `scripts/verify-supabase.mjs`, `supabase/FINAL_SETUP.sql`            |
| Impact         | Cannot prove 46 tables exist on target project                       |
| Root cause     | No `.env` with Supabase credentials in audit environment             |
| Fix            | Apply `FINAL_SETUP.sql`, set env vars, run `bun run supabase:verify` |
| Validation     | All expected tables report present                                   |

### AUD-003 — Live RLS verification not executed

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| Severity       | Critical                                                       |
| Status         | BLOCKED                                                        |
| Affected files | `scripts/verify-rls.mjs`, `supabase/phase22.sql`–`phase25.sql` |
| Impact         | Cannot prove RLS enabled on production database                |
| Root cause     | Requires `SUPABASE_DB_PASSWORD` or `SUPABASE_DB_URL`           |
| Fix            | Owner runs `bun run supabase:rls` against staging/prod         |
| Validation     | Script reports RLS enabled on 27+ core tables                  |

### AUD-004 — OAuth providers not verified on production domain

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| Severity       | High                                                                |
| Status         | BLOCKED                                                             |
| Affected files | Supabase dashboard, `src/lib/auth.tsx`, `/auth/callback`            |
| Impact         | GitHub/Google login may fail in production                          |
| Root cause     | Dashboard Site URL and redirect URLs not configured for prod domain |
| Fix            | Configure Site URL, `/auth/callback`, `/reset-password` redirects   |
| Validation     | OAuth round-trip on production domain                               |

### AUD-005 — Email/digest/account-deletion endpoints not deployed

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Severity       | High                                                                      |
| Status         | BLOCKED                                                                   |
| Affected files | `api/email.ts`, `api/digest.ts`, `api/account-deletion.ts`                |
| Impact         | Transactional email, digests, and account deletion non-functional in prod |
| Root cause     | Endpoints and server secrets not deployed                                 |
| Fix            | Deploy API routes; set Resend, digest secret, service role                |
| Validation     | Send test email; dry-run digest; delete test account                      |

### AUD-006 — Separate-account role smoke tests not run

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Severity       | High                                                 |
| Status         | BLOCKED                                              |
| Affected files | `docs/RELEASE_CHECKLIST.md`, member/admin routes     |
| Impact         | Role boundaries unproven in live environment         |
| Root cause     | Requires live Supabase + multiple test accounts      |
| Fix            | Run manual smokes: member, lead, admin, removed user |
| Validation     | Checklist in `RELEASE_CHECKLIST.md` all checked      |

### AUD-007 — Storage bucket policies not live-verified

| Field          | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Severity       | High                                                    |
| Status         | BLOCKED                                                 |
| Affected files | `src/lib/storage.ts`, Supabase Storage dashboard        |
| Impact         | Cross-user avatar/file writes possible if misconfigured |
| Root cause     | Storage policies require dashboard + live tests         |
| Fix            | Configure buckets; test cross-user write denial         |
| Validation     | Member A cannot write to Member B's avatar path         |

### AUD-020 — Competition submissions blocked on seed catalog

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Severity       | Medium                                                                   |
| Status         | BLOCKED                                                                  |
| Affected files | `src/lib/competitions.ts:96-99`, `supabase/phase25.sql`                  |
| Impact         | Users see competitions but cannot submit until DB has real rows          |
| Root cause     | Fallback uses `seed-*` IDs when DB empty; guard rejects submissions      |
| Fix            | Apply phase25; ensure `competitions` table seeded; open challenge status |
| Validation     | Submit entry on live competition UUID succeeds                           |

---

## Product / feature gaps

### AUD-008 — Experiment reproducibility model incomplete

| Field          | Value                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Severity       | High                                                                                                             |
| Status         | PARTIAL                                                                                                          |
| Affected files | `supabase/phase25.sql` (`project_experiments`, `project_deliverables`), `docs/RESEARCH_AND_STARTUP_INTEGRITY.md` |
| Impact         | Cannot track immutable runs, metrics, dataset versions, checkpoints                                              |
| Root cause     | Phase25 adds experiments/deliverables; full run/metric immutability not implemented                              |
| Fix            | Extend schema + UI for run records, frozen metrics, reproducibility review                                       |
| Validation     | Experiment claim links to immutable run artifact with verified status                                            |

### AUD-009 — Startup CRM / confidentiality schema missing

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| Severity       | High                                                                |
| Status         | DEFERRED                                                            |
| Affected files | `docs/RESEARCH_AND_STARTUP_INTEGRITY.md`, project engine only       |
| Impact         | Startup diligence, pilots, revenue, funding not first-class         |
| Root cause     | Startup projects use universal project engine without CRM tables    |
| Fix            | Add startup validation tables per RESEARCH_AND_STARTUP_INTEGRITY.md |
| Validation     | Confidential startup fields admin-only; public copy gated           |

### AUD-010 — Reviewer role not independent from project lead

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Severity       | Medium                                                                |
| Status         | RESOLVED (local)                                                      |
| Affected files | `supabase/phase27.sql`, `project-collaboration.ts`, Evidence UI       |
| Impact         | Reviewers could not review only assigned work independently           |
| Root cause     | Contribution review path was lead/admin-centric                       |
| Fix            | `assigned_reviewer_id` + `assign_contribution_reviewer` RPC + UI gate |
| Validation     | Unit tests for `canReviewContribution`; live multi-account still owner |

### AUD-011 — Publications page is marketing stub

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Severity       | Low                                                          |
| Status         | RESOLVED                                                     |
| Affected files | `src/routes/publications.tsx`, `src/lib/content.ts`, phase26 |
| Impact         | Public visitors see teaser, not live paper list              |
| Root cause     | Was marketing stub; now fetches published papers             |
| Fix            | `fetchPublicPapers()` + anon RLS in phase26                  |
| Validation     | `/publications` lists published papers or empty CTA          |

### AUD-012 — Labs/people/partnerships are static not DB-backed

| Field          | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Severity       | Low                                                                                    |
| Status         | PARTIAL                                                                                |
| Affected files | `src/lib/labs.ts`, `src/routes/labs/*`, AdminLabsTab; people/partnerships still static |
| Impact         | Labs editable via admin; people/partnerships still code deploy                         |
| Root cause     | Pass 2 wired labs; people/partnerships deferred                                        |
| Fix            | Labs: DB + admin CMS done. Optional: partnerships CMS                                  |
| Validation     | Admin can edit lab copy without code change                                            |

### AUD-013 — Guides are bundled static content

| Field          | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Severity       | Low                                                     |
| Status         | PARTIAL                                                 |
| Affected files | `src/content/guides/index.ts`, `/guides/*`              |
| Impact         | Guide updates require code deploy                       |
| Root cause     | Educational content shipped as bundled modules          |
| Fix            | Optional: admin guides tab already exists for DB guides |
| Validation     | New guide publishable via admin without deploy          |

### AUD-014 — Research learning pathways static

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Severity       | Low                                       |
| Status         | PARTIAL                                   |
| Affected files | `src/lib/research-paths.ts`, `/research/` |
| Impact         | Pathways not personalized or DB-tracked   |
| Root cause     | Static config arrays                      |
| Fix            | DB-backed pathways with progress linkage  |
| Validation     | Member progress persists per pathway step |

### AUD-015 — No dedicated project archive UX

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Severity       | Medium                                                   |
| Status         | RESOLVED                                                 |
| Affected files | project lifecycle, `/projects/$slug`                     |
| Impact         | Closed projects previously lacked archive presentation   |
| Root cause     | Status field existed without an archive-specific view     |
| Fix            | Closed/alumni filter + public detail and verified outputs |
| Validation     | Closed project remains visible without application intake |

### AUD-016 — No dataset registry

| Field          | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Severity       | Medium                                                      |
| Status         | RESOLVED                                                    |
| Affected files | `project_datasets` (phase26), `src/lib/project-datasets.ts` |
| Impact         | Datasets referenced only as URLs in contributions           |
| Root cause     | Was missing; phase26 adds project_datasets                  |
| Fix            | Dataset registry per project + manage UI                    |
| Validation     | Lead can register versioned dataset on project              |

### AUD-017 — Analytics not implemented

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Severity       | Medium                                                             |
| Status         | RESOLVED                                                           |
| Affected files | `src/lib/analytics.ts`, `__root.tsx`, `.env.example`               |
| Impact         | No usage telemetry or conversion tracking                          |
| Root cause     | Adapter added; live domain optional                                |
| Fix            | Plausible-style adapter; no-op when unconfigured                   |
| Validation     | Page views fire when `VITE_ANALYTICS_DOMAIN` set; silent otherwise |

---

## CI / tooling

### AUD-018 — CI missing typecheck

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Severity       | Medium                                                           |
| Status         | RESOLVED                                                         |
| Affected files | `.github/workflows/ci.yml`                                       |
| Impact         | Type errors could merge if build step masks them                 |
| Root cause     | CI runs lint/test/build but not explicit typecheck               |
| Fix            | Add `bun run typecheck` step                                     |
| Validation     | CI workflow includes typecheck; local `bun run typecheck` passes |

### AUD-019 — CI missing release:check

| Field          | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Severity       | Medium                                                      |
| Status         | RESOLVED                                                    |
| Affected files | `.github/workflows/ci.yml`, `scripts/release-readiness.mjs` |
| Impact         | Copy/security scans and artifact checks skipped in CI       |
| Root cause     | Was missing; now in CI. Strict mode only via BU1LD_RELEASE_STRICT |
| Fix            | Add `bun run release:check` to CI; CI env no longer forces strict |
| Validation     | Local release:check PASS; CI runs non-strict gate           |

### AUD-021 — Deploy workflow skips test gate

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Severity       | Medium                                                   |
| Status         | RESOLVED                                                 |
| Affected files | `.github/workflows/deploy-cloudflare.yml`                |
| Impact         | Broken code could deploy to production                   |
| Root cause     | Deploy had no test dependency                            |
| Fix            | `verify` job (typecheck/test/build) required before deploy |
| Validation     | Failed tests block deploy                                |

### AUD-022 — No Playwright E2E suite

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Severity       | Medium                                               |
| Status         | DEFERRED                                             |
| Affected files | —                                                    |
| Impact         | Critical journeys rely on manual smoke only          |
| Root cause     | Explicitly deferred in prior audit                   |
| Fix            | Add Playwright for signup→onboard→apply→lead approve |
| Validation     | E2E green in CI against staging                      |

### AUD-023 — No live Supabase integration tests in CI

| Field          | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Severity       | Medium                                                 |
| Status         | DEFERRED                                               |
| Affected files | test suite                                             |
| Impact         | RLS semantics unproven automatically                   |
| Root cause     | Requires disposable Supabase project or local Supabase |
| Fix            | Add CI job with test project credentials               |
| Validation     | RLS tests pass in CI                                   |

---

## Documentation / config (Pass 1 fixes)

### AUD-024 — Doc drift: phase24 cited as latest

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Severity       | Low                                                                                     |
| Status         | RESOLVED                                                                                |
| Affected files | `README.md`, `DATABASE_SETUP.md`, `docs/RELEASE_CHECKLIST.md`, `docs/SECURITY_AUDIT.md` |
| Impact         | Operators may skip phase25 migrations                                                   |
| Root cause     | Docs not updated when phase25 landed                                                    |
| Fix            | Update all references to phase25                                                        |
| Validation     | Grep shows phase25 as latest in setup docs                                              |

### AUD-025 — VITE_ACCOUNT_DELETION_ENDPOINT missing from .env.example

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Severity       | Low                                                              |
| Status         | RESOLVED                                                         |
| Affected files | `.env.example`, `src/lib/account-security.ts`                    |
| Impact         | Operators may omit account deletion endpoint config              |
| Root cause     | Env var added in code but not documented                         |
| Fix            | Add to `.env.example` with comment (Phase 0 patch-up 2026-07-17) |
| Validation     | Variable documented; release:check passes                        |

### AUD-026 — Stale test counts in completion reports

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| Severity       | Low                                            |
| Status         | RESOLVED                                       |
| Affected files | `TEST_REPORT.md`, `FINAL_COMPLETION_REPORT.md` |
| Impact         | Misleading audit evidence                      |
| Root cause     | Reports from prior pass (78/90 vs current 95)  |
| Fix            | Update to 95 tests / 19 files                  |
| Validation     | Reports match `bun run test` output            |

### AUD-027 — Duplicate SECURITY_AUDIT at repo root

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Severity       | Low                                                                      |
| Status         | PARTIAL                                                                  |
| Affected files | `SECURITY_AUDIT.md`, `docs/SECURITY_AUDIT.md`, `docs/SECURITY_REVIEW.md` |
| Impact         | Confusion about canonical security doc                                   |
| Root cause     | Root copy required by release gate artifact list                         |
| Fix            | `SECURITY_REVIEW.md` canonical; root file cross-links                    |
| Validation     | Single source of truth in docs/SECURITY_REVIEW.md                        |

### AUD-028 — PRODUCT_AUDIT cites uncommitted changes

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Severity       | Low                                                        |
| Status         | INVALIDATED                                                |
| Affected files | `docs/PRODUCT_AUDIT.md`                                    |
| Impact         | Stale risk signal                                          |
| Root cause     | Written when tree was dirty; now clean at `d49626b`        |
| Fix            | Note invalidation in DECISION_LOG; no code change required |
| Validation     | `git status` clean                                         |

---

## Security / resilience

### AUD-029 — In-memory rate limiting not distributed

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Severity       | Medium                                                     |
| Status         | PARTIAL                                                    |
| Affected files | `src/lib/security.ts`, API handlers                        |
| Impact         | Rate limits reset per worker; abuse possible at scale      |
| Root cause     | Single-process in-memory counters                          |
| Fix            | KV/Redis or DB-backed counters when abuse pressure appears |
| Validation     | Rate limit persists across workers                         |

### AUD-030 — Mobile/accessibility not exhaustively tested

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Severity       | Medium                                                   |
| Status         | PARTIAL                                                  |
| Affected files | `src/components/member/MobileTabBar.tsx`, loading states |
| Impact         | Device-specific layout/a11y issues may exist             |
| Root cause     | Manual smoke only; no device matrix                      |
| Fix            | E2E + manual device QA for critical paths                |
| Validation     | WCAG spot-check on dashboard, apply, admin               |

### AUD-031 — No monitoring/incident runbook

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| Severity       | Medium                                            |
| Status         | UNRESOLVED                                        |
| Affected files | —                                                 |
| Impact         | Email/digest/deletion failures undetected         |
| Root cause     | Not yet authored                                  |
| Fix            | Add runbook doc + alert hooks on handler failures |
| Validation     | Simulated failure triggers alert                  |

### AUD-032 — Admin claim source URL validation incomplete

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Severity       | Medium                                           |
| Status         | RESOLVED                                         |
| Affected files | `src/lib/institutional-claims.ts`, AdminClaimsTab |
| Impact         | Verified claims could publish without source URL |
| Root cause     | Was UI-only; now lib gate + disabled button      |
| Fix            | `canVerifyInstitutionalClaim` before verify RPC  |
| Validation     | Unit tests + Verify disabled without URL         |

---

## Intentionally working (resolved by design)

### AUD-033 — Demo seed fallback in development only

| Field          | Value                                                     |
| -------------- | --------------------------------------------------------- |
| Severity       | Info                                                      |
| Status         | RESOLVED                                                  |
| Affected files | `src/lib/supabase-fallback.ts`                            |
| Impact         | Local dev works without Supabase; prod shows empty states |
| Root cause     | N/A — by design                                           |
| Fix            | None                                                      |
| Validation     | `isDemoMode()` false in production; tests pass            |

### AUD-034 — Production copy regression guards

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Severity       | Info                                                               |
| Status         | RESOLVED                                                           |
| Affected files | `src/lib/production-copy.test.ts`, `scripts/release-readiness.mjs` |
| Impact         | Setup language blocked from user UI                                |
| Root cause     | N/A — implemented                                                  |
| Fix            | None                                                               |
| Validation     | release:check copy scans pass                                      |

### AUD-035 — Seed content integrity scanning

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| Severity       | Info                                              |
| Status         | RESOLVED                                          |
| Affected files | `src/lib/content-integrity.test.ts`, release gate |
| Impact         | Unsupported affiliation claims blocked in seeds   |
| Root cause     | N/A — implemented                                 |
| Fix            | None                                              |
| Validation     | content-integrity test passes                     |

---

## Summary counts

| Status      | Count  |
| ----------- | ------ |
| BLOCKED     | 8      |
| UNRESOLVED  | 5      |
| PARTIAL     | 12     |
| RESOLVED    | 6      |
| DEFERRED    | 3      |
| INVALIDATED | 1      |
| **Total**   | **35** |
