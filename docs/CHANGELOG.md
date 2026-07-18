# Changelog

## Finalization Pass One — 2026-07-18 — Contribution integrity + operations

### Added

- `supabase/phase32.sql` — hard ban on contribution self-review and self-reviewer assignment
- Leadership operations counters for review backlog, overdue milestones, unowned projects, and stalled projects
- Contribution evidence export and inclusion in full account export
- Standard `Makefile` quality/release commands and persistent `.project-finalization/` evidence

### Changed

- Removed project-specific public backend values from `wrangler.jsonc`; CI/deploy use environment configuration
- Expanded production-copy/release scans for internal vendor/setup language
- Cloudflare deployment verifies the complete release gate and dependency audit before deploy

### Verified

- Typecheck and **130 tests** pass after phase32 and export changes; final all-gates rerun is recorded in `.project-finalization/TEST_EVIDENCE.md`

## Phase 4 — 2026-07-18 — Public project discovery + validation

### Added

- Visitor-accessible `/projects` catalog and detail flow with signup/login return paths
- `supabase/phase30.sql` — column-scoped anon project catalog and server-side project brief/resource validation
- Project update validation tests for safe internal/external workspace links

### Changed

- Removed dead lead-facing publication controls; publication remains administrator-governed
- Management/edit routes show explicit ownership denial for unrelated project leads
- Pinned workspace resources use safe-path/URL rendering
- Root analytics uses the browser search string safely (browser QA caught object coercion crash)

### Verified

- Desktop/mobile project discovery, mobile menu, and signup redirect verified in browser
- typecheck, lint, **126 tests**, smoke, build, `release:check` PASS

## Phase 4 — 2026-07-18 — Public evidence archive + commitment

### Added

- `supabase/phase28.sql` — evidence-safe public reads for milestones/contributions
- `supabase/phase29.sql` — `projects.weekly_commitment_hours`
- `/evidence` public project output archive (`fetchPublicProjectOutputs`)
- Institution journey plumbing: deep-link auth, lead questions, research bridge, skills matching

### Changed

- Authenticated contribution public branch requires `verification_status = 'verified'`
- Release artifacts / VERIFY / apply through phase29
- Regenerated `routeTree.gen.ts` (includes `/announcements`)

### Verified

- typecheck, lint, **123 tests**, smoke, build, `release:check` PASS
- `release:prod` BLOCKED (owner secrets)

## Phase 3–4 — 2026-07-17 — Harden + release packaging

### Added

- `supabase/phase27.sql` — `assigned_reviewer_id`, `assign_contribution_reviewer`, review RPC allows assigned reviewer
- Contribution assign/verify UI in `ProjectEvidenceSection`
- Admin papers pagination; route registry smoke (`bun run smoke`)
- `canReviewContribution` unit tests

### Changed

- Claim verify gate; CI `release:check`; deploy verify-before-deploy
- Release artifacts / VERIFY / apply scripts through phase27
- Docs: PROJECT_STATUS, DEMO_GUIDE, KNOWN_LIMITATIONS, RELEASE_CHECKLIST

### Verified

- typecheck, lint, **117 tests**, smoke, build, `release:check` PASS
- `release:prod` BLOCKED (owner secrets)

## Pass 2 — 2026-07-17 — Heavy Additions and Core Creation

### Added

- `supabase/phase26.sql` — profile enrichment, paper venue/prerequisites/editorial_summary, anon public papers RLS, research_paths + progress, application questions, project_datasets
- `src/lib/labs.ts`, AdminLabsTab, DB-backed `/labs/*`
- `fetchPublicPapers()` + live `/publications` catalog
- Project workspace extras (experiments, deliverables, datasets)
- Profile/onboarding: availability, experience_level, desired_roles
- `src/lib/analytics.ts` (Plausible-style; no-op when unconfigured)
- Research path DB fetch + progress helpers
- Tests: labs, analytics, datasets, experiments; release-artifacts phase26

### Changed

- CI typecheck; `.env.example` account deletion + analytics domain
- Admin papers publish sets `review_status = published`
- Projects create/edit support `lab_id`

### Verified

- typecheck, lint, **106 tests**, build, `release:check` PASS
- `release:prod` BLOCKED (owner secrets)

## Pass 1 — 2026-07-17 — Audit, Permanent Memory, and Light Reworks

- Permanent memory infrastructure (15 docs) + AUDIT_MASTER (35 issues)
- Local gates documented; owner blockers listed
