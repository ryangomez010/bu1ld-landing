# Changelog

## 2026-10-16 — local website completion, waiting for connection

The user approved BU1LD-Web as the successor source for the existing Nexus Worker,
then explicitly requested local coding and waiting for connection. Wrangler is
locally prepared for `the-bu1ld-nexus` / `thebu1ld.com`; nothing was deployed.
This pass completes answer checks across all 120 ML articles plus six essays,
repairs public loading/navigation, member/auth/onboarding/drafts/deletion flows,
and hardens verification/deployment tools. Final local suite: **248 tests,
4,299 assertions, zero failures**; full-repository lint, scoped content compiler,
catalog/sitemap/manifest checks and 29-route static smoke pass. Full application
compiler/build/browser QA remain resource-gated, and connected role/backend QA
is pending. Preserve the dirty source; do not commit or push without a request.
See [the complete status](WEBSITE_STATUS_2026-10-16.md),
[verification receipt](WEBSITE_VERIFICATION_2026-10-16.json), and
[release configuration details](RELEASE_TOOLING_2026-10-16.md).


## Machine-readable Public Portfolio — 2026-10-11

### Added

- `/portfolio-manifest.json` with all 6 verified destinations, 20 canonical source identities, and 33 evidence-bounded research lines
- Stable absolute profile URLs, the E0–E8 evidence legend, source-revision metadata, limitations, and explicit claim boundaries in the export
- `manifest:generate` and `manifest:check` commands plus drift, coverage, URL, negative-evidence, and local-path/secret leakage tests
- Direct manifest downloads from `/network` and `/research-atlas`, plus an alternate JSON discovery link in the document head

### Changed

- The release gate now verifies the public JSON manifest alongside the generated sitemap and critical route inventory before deployment checks
- Public data export is generated from the typed browser-safe registries instead of becoming a separately maintained source of truth

### Verification

- HTTP verification returned `200 application/json` and confirmed counts of 6 destinations, 20 identities, 17 bound sources, 3 unresolved sources, and 33 research lines
- Typecheck, 179 tests with 1,197 assertions, 27-route smoke, research-state validation, high-severity dependency audit, targeted lint, and the development client/SSR build pass
- Browser QA visibly confirmed the download on `/network`; the release gate reaches and passes manifest/sitemap/route checks, then stops only on missing production Supabase URL and anon/publishable key
- Full-repository lint currently reports one Prettier formatting error in the concurrently added `src/lib/member-navigation.ts`; this pass leaves that unrelated active work untouched

## Portfolio Discovery and Sitemap Integrity — 2026-10-11

### Added

- Shareable search and classification filters for all 20 canonical identities on `/network`
- Keyboard search, live result counts, filter totals, clear controls, and a recoverable zero-result state
- Registry-driven sitemap generation and drift checking through `sitemap:generate` and `sitemap:check`
- Exact sitemap tests covering all 20 portfolio profiles, all 33 research records, uniqueness, and private-route exclusion

### Changed

- Default atlas and network searches are optional URL state, preserving clean ordinary links while retaining shareable filtered views
- The release gate now checks the generated sitemap and critical route inventory before evaluating deployment configuration
- `public/sitemap.xml` is generated from the public portfolio and research registries instead of being maintained by hand

### Verification

- Browser QA confirmed `?filter=unresolved` returns exactly three identities, `?q=neuro` returns NeuroCAD, and unmatched queries expose a resettable empty state
- Typecheck, lint, 176 tests with 1,131 assertions, 27-route smoke, research-state validation, high-severity dependency audit, and sitemap drift checks pass locally
- The development client/SSR build passes; the release gate then remains fail-closed on missing production Supabase configuration

## Complete BU1LD Research Atlas — 2026-10-11

### Added

- `/research-atlas` — a searchable, filterable public index for all 33 canonical BU1LD research lines
- Source-bound recovery from clean `the-bu1ld-nexus` revision `a5464067d3f154f306d7e3d11d66edcda3e347ef`
- `/research-atlas/<slug>` — a stable page for every study, report, prototype, and foundry, including negative, null, mixed, synthetic-only, and specification-only states
- Verified repository destinations for nine research lines and explicit one-to-one links to eight matching control-plane identities
- Shareable search/filter URLs, keyboard search, result counts, reset states, and four guided research paths over the same canonical records
- Related-work paths on every research detail page, ranked by shared tags and research stage without creating new project identities
- Bidirectional atlas links on portfolio profiles where the registries declare an explicit identity mapping
- All 33 research pages and the atlas index in the public sitemap

### Changed

- Public navigation now leads to the complete research atlas; the product/source identity network remains separately linked
- `/network` now explains and links the distinction between 33 research lines and 20 product/source identities
- Research copy preserves retained evidence boundaries instead of converting code, prototypes, or smoke runs into success claims

### Verification

- Search interaction narrowed 33 records to the expected seven memory results and persisted the state at `?filter=all&q=memory`
- Browser QA verified related-work discovery and the explicit NeuroCAD atlas/profile backlink with no console errors
- Typecheck, lint, 171 tests with 1,063 assertions, 27-route smoke, research-state validation, high-severity dependency audit, and development client/SSR builds pass locally
- The refreshed portfolio preflight reports no broken local Markdown links for BU1LD; dirty-state review, live Supabase verification, and multi-role browser checks remain release gates
- Production deployment remains blocked by the absent Cloudflare API token and production Supabase configuration

## Canonical Project Webpages — 2026-10-11

### Added

- A stable `/portfolio/<project-id>` webpage for every one of the 20 identities in `research/PROJECT_REGISTRY.yaml`
- Evidence level, source status, current implementation, intended output, limitations, and verified destination links on each public profile
- All 20 canonical profile URLs in the public sitemap

### Changed

- Every canonical card on `/network` now links to its project webpage, including unresolved and archive records without invented source or deployment links
- Route smoke and registry-sync tests now require the public portfolio profile system

### Verification

- All 20 profile URLs returned HTTP 200 from the local SSR development server
- Typecheck, lint, 165 tests with 729 assertions, 25-route smoke, and development client/SSR builds pass locally
- Production deployment remains blocked by the absent Cloudflare API token and production Supabase URL/anon key

## Portfolio Network — 2026-10-11

### Added

- `/network` — a public, browser-safe directory for verified website destinations and all 20 canonical portfolio identities
- Registry-sync tests that fail when the public projection drifts from `research/SOURCE_BINDINGS.json`

### Changed

- Public navigation, member navigation, command palette, footer, sitemap, and route smoke now link the portfolio directory
- FinanceMeta's homepage footer now links back to the live BU1LD root while retaining its finance-specific identity and disclaimer
- Public destinations distinguish live, preview, and owner-only states; no local source paths or private portal URL are shipped

### Verification

- The BU1LD and FinanceMeta public destinations returned HTTP 200 on 2026-10-11
- VertexED's fallback deployment returned HTTP 200; its custom domain remains unlinked because TLS still fails
- Obscured Records remains owner-only and is represented by its public source repository rather than a 401 destination
- Typecheck, lint, 164 tests, 24-route smoke, research-state validation, and development client/SSR build pass locally
- Desktop and 390 px browser QA passed with no console warnings/errors; the portfolio filters return the expected three unresolved records

## Member Evidence Workspace — 2026-10-10

### Added

- `/workspace` — a unified, member-only surface for durable project memberships, milestone-linked evidence, review states, revisions, and contribution export
- `supabase/phase34.sql` — active/paused collaborator visibility for unpublished project metadata without extending access to alumni or removed members

### Changed

- Desktop/mobile navigation, command palette, dashboard, and accepted applications now point members to their work log
- Research and product documentation now treat submitted, verified, and needs-changes evidence as distinct states

### Verification

- Typecheck, lint, 160 tests, route smoke, research-state validation, high-severity dependency audit, frozen-lockfile install, and the development client/SSR build pass locally
- Signed-out browser QA preserves `/workspace` as the single post-login destination and no longer nests login redirects
- Production build/release verification remains fail-closed until the deployment Supabase URL and anon/publishable key are available

## Landing Pass Two — 2026-07-19 — Conversion, SEO, atomic applications

### Added

- `supabase/phase33.sql` — atomic `submit_project_application` with required-answer enforcement
- Homepage featured projects section and project-first hero CTA
- Shared `src/lib/seo.ts` helpers, Organization JSON-LD, route canonicals
- `landing-sites-release/` evidence package for multi-site registry

### Changed

- Removed cinematic Genesis intro and decorative UTC clocks
- Header/footer navigation prioritize Projects and Evidence
- Public project fetches abort on timeout; anonymous detail stays on public columns
- NeuralField density and frame cost reduced

### Verified

- `release:check`, smoke, audit, and production build PASS locally
- Public HTTP probe confirms canonicals on critical acquisition routes

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
