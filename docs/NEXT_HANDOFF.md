# Next Handoff

## 2026-10-21 — mentorship/community authorization and setup synchronization

Read [the current completion report](COMPLETION_2026-10-21.md) and [verification receipt](COMPLETION_2026-10-21.json). New forward phase40 repairs broad phase39 grants, mutable request identity/content, unchecked decision transitions, author moderation bypass and hidden-parent visibility. The fresh-install bundle now includes phases39–40 with a deterministic generator and release drift check. The schema verifier covers the new feature tables and controls. A guarded rollback-only local role contract is prepared but **has not executed**.

Mentorship reads now distinguish failures from confirmed empty results; pages provide retry/loading states, bounded requests and pending-action controls. A decision is only confirmed when the database returns the updated row. Institutional admin/lab-lead/mentor UI access matches the policy checks.

Current verification: **322 tests / 5,554 assertions**, full-repository lint, schema/catalog/sitemap/manifest checks, 34 static routes, research-state validation and whitespace checks pass. Full semantic typecheck/build/browser QA remain resource-blocked (192 MiB free plus speculative, rising pageouts, 175 MiB system-disk space). Strict release stops at missing deployment/backend/email settings. The connector exposes only a project named for VertexED; the intended BU1LD environment still needs to be connected. No SQL execution, live RLS test, commit, push or deployment occurred. All existing dirty work is preserved.

The current migration target is **phase40**, superseding phase34/38 instructions below. For an existing database inspect the migration ledger and apply only missing phases after backup and isolated rehearsal; the combined bundle is for a fresh installation.

## 2026-10-21 — public cohesion pass and mentorship type repair

The homepage now presents the institution's access and review contract before visitors choose a
path: public briefs and learning, account-backed progress, reviewed workspace admission, and
evidence-gated release. Desktop visitors retain the in-page section index while scrolling; the
public library is a first-class destination; featured projects expose an explicit full-brief
action; program links use client navigation and lead to a complete comparison; and the footer now
separates exploration, participation, and institutional routes. These changes preserve project
discovery as the primary conversion and do not claim live intake, results, or partnerships.

The bounded compiler also exposed a real phase39 integration defect. `mentor_profiles` and
`mentorship_requests` were absent from the typed Supabase schema, so their writes resolved to
`never`; the request query also attempted to read `full_name` from the mentor availability row
instead of its related profile. The schema types and nested relationship projection are now
synchronized, and both mentorship routes use stable reload callbacks with no hook warnings.

Final local verification on the resulting tree: **318 tests / 5,507 assertions**, full-repository
ESLint with zero warnings, sequential bounded semantic diagnostics across **391 source files**,
34-route static smoke, guide catalog verification (**120 articles / 10 tracks / 35,625 body
words**), sitemap and public-manifest synchronization, research-state validation, high-severity
dependency audit, Prettier checks for every touched source file, and diff whitespace checks pass.

Browser QA and a development or production bundle were not rerun. The local preview failed to
reach a listening state, and the final resource sample had about 115 MiB free plus speculative
memory with pageouts rising from the initial sample, below the documented 512 MiB admission floor.
No database migration, connected Supabase/RLS/provider/email check, multi-role browser flow,
commit, push, public upload, or deployment occurred. Preserve the full dirty worktree and keep the
live queue below open.

## 2026-10-19 — accepted-member workspace targeting

Accepted applications now send a signed-in member to `/workspace?project=<slug>`, where the member workspace selects that project only if it is present in the account's durable membership list. Switching project cards keeps the selected project in the bounded URL state, so a refreshed or copied internal workspace link retains its context. An unknown, overlong, or unauthorized slug falls back to the member's existing workspace selection; it does not grant access or change server-side authorization.

Focused verification: 16 tests / 60 assertions across post-auth redirects, member workspace, and portal UX passed; targeted Prettier, ESLint, and diff whitespace checks passed. No database, release configuration, live role check, build, or deployment was run. Full semantic typecheck and production build remain gated by the documented 512 MiB memory admission requirement.

## 2026-10-18 — clearer public journey and homepage wayfinding

The homepage now has a keyboard-visible, horizontally scrollable section index for its seven highest-value destinations, including a stable anchor for currently open work. The former narrative “what we do” block is now a four-stage contribution path: explore public context, apply with a profile, build with evidence, and publish only after review. Each stage names its access boundary and links to the corresponding real route. Copy now consistently states that reading paths are public while saving progress, applying, and maintaining contribution records require an account; the previous contradictory account requirement was removed.

Verification for this follow-up: **313 tests / 5,495 assertions**, focused ESLint for every changed source file, Prettier, and diff whitespace checks pass. Full semantic typecheck, build, and browser QA were not rerun because free plus speculative memory remained below the documented 512 MiB admission floor; the immediately preceding full semantic check remains the latest whole-program compiler receipt. No commit, push, deployment, database mutation, or production configuration change occurred.

## 2026-10-18 — source security hardening complete, live verification pending

The current dirty candidate now includes the requested institutional overview and a second security pass across public links, request adapters, privileged service endpoints, browser email delivery, and the Supabase migration chain. Supabase configuration accepts only the exact HTTPS project origin; production request construction ignores forged forwarded hosts; bearer-token service endpoints remain same-origin; browser code no longer reads email or Resend secrets; HTTPS API responses include HSTS; redirect, JSON-LD, credentialed URL, and stored public-link handling fail closed. Phase37 binds privileged helpers to the authenticated caller. Phase38 cleans and constrains notification destinations to internal paths and removes public execution from trigger-only helpers. Phases35–38 remain unapplied and must be reviewed and applied together through the controlled release flow.

Final local verification: **311 tests / 5,486 assertions**, full repository lint, semantic TypeScript check, generated sitemap/manifest/catalog checks, 34-route static smoke, high-severity dependency audit, secret-pattern scan, and diff whitespace checks pass within their stated scope. `release:check` reaches the deployment boundary and stops because this checkout has no production `VITE_SUPABASE_URL` or public Supabase key. No connected database, RLS, provider, email, multi-role browser, build, or deployed-revision claim follows from these local checks. No commit, push, database mutation, public upload, or deployment occurred; preserve the entire dirty worktree.

## 2026-10-16 — master implementation, acceptance incomplete

Read [the current handoff](WEBSITE_STATUS_2026-10-16.md) and the `masterExecution` receipt before acting. Local candidate `main` / `134f63fb10741f695cc29210e40b3ac3b5ea4e09`: 40 classified research pages, 144 learning entries including 48 structured lessons/12 tracks, 12 passing CPU exercises, and **100 source-checked private paper reviews** (86,580 words; zero approved/published). Native public discovery and homepage catalog previews, operational event/editorial interfaces, and privacy-bounded analytics are implemented. Phases35–38 are unapplied; phases37–38 contain the latest privilege and stored-destination hardening. All 100 draft mappings are ready for human editorial review; no further review-count writing is required.

Final bounded checks: 308 tests / 6,061 assertions, full lint, synchronized generated artifacts, 34-route static smoke, 100-review validation/export and link audit pass within their stated scope. One external URL remains HTTP403 access-restricted. Full semantic typecheck/build/browser, connected backend/RLS/provider/email and production deployment remain open. Resource admission and the intended isolated backend are required before those checks; human approval and release authority remain separate. Preserve all dirty user work and earlier failures; never inspect Worldcastr for this assignment. No commit, push, production mutation, public upload or deployment occurred.

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

## 2026-10-15 — expanded articles and revised reference essays

The member library now contains 120 ML articles plus six reference essays: two new
articles in each of ten learning paths, ten improved existing ML articles, and all
six essays revised. New material covers entropy, likelihood, grouped evaluation,
delayed labels, quantiles, monotonic constraints, decision costs, learning curves,
whitening, retrieval, clipping, freezing, IoU, image preprocessing, perplexity,
masks, batching, feature parity, paired runs, and practical effect sizes. Thirty ML
articles and all six essays include worked exercises with answer checks. All old
slugs and ML path ordering remain intact; saved progress is not reset. Fresh
verification: 210 tests / 3,595 assertions, changed-file lint, scoped strict content
and generator typecheck, catalog synchronization, 29-route static smoke, and 18
arithmetic checks passed. Full application build/typecheck, browser QA, and release
gates remain open. Nothing was committed, pushed, or deployed. See
`docs/ML_ARTICLE_EXPANSION_2026-10-15.md` and its JSON verification receipt. Preserve
all pre-existing public/member/portfolio changes.

## 2026-10-15 — public navigation, benefits, and project discovery

The homepage and institutional pages now share a responsive header, readable
navigation, and a scrollable mobile menu with account access. A shorter hero and
linked benefit cards put useful starting points first. Public application paths
show audience/commitment before signup and preserve the selected destination.
Project filters are URL-backed, completed work is searchable under All, and
catalog failures expose retry instead of a false empty directory. All 209 tests
(2,845 assertions), changed-file lint, generated-content checks, and 29-route static
smoke pass. Full semantic typecheck, build, and browser/role QA remain outstanding:
memory stayed below the 512 MiB admission floor with rising pageouts. Nothing was
committed, pushed, or deployed. See `docs/PUBLIC_UX_2026-10-15.md` for scope and the
exact remaining checks. Preserve all other dirty member and portfolio work.

## 2026-10-14 — learning paths and reliable reading progress

Extended the member library with ten ordered learning paths, URL-persisted filters/result counts, filter-preserving article navigation, resume/mark-complete controls, independent article/progress loading, and explicit sync/retry states. A tested persistence store preserves newer device progress, serializes writes within the client, handles unavailable storage, and uses bounded remote requests without changing the schema. All 201 tests (2,802 assertions), full-repository lint, catalog/sitemap/manifest checks, and 29-route static smoke passed. The final bounded compiler run passed all 341 application source files with unchanged TypeScript settings. See `docs/MEMBER_PORTAL_COMPLETION_2026-10-14.md` and its verification receipt for the exact scope and results. Production remains blocked by absent deployment configuration and denied BU1LD Supabase management access. Build, authenticated browser/role QA, and deployment remain outstanding. Preserve the other dirty portfolio changes.

## 2026-10-11 — 100 ML articles and searchable member library

Added 100 distinct ML articles (22,233 body words) across ten topics; retained the six existing essays. `/guides` now has search, topic/level/progress filters, progressive loading, and a foundations entry point. Topic article bodies load lazily; readers include sources and within-topic navigation. All 189 tests, focused lint, catalog checks, and the article/catalog typecheck passed. Full-project TypeScript hit the 512 MB heap cap; no full build, browser QA, or deployment ran. See `docs/ML_ARTICLE_LIBRARY_2026-10-11.md` for the complete inventory and remaining validation, and `docs/ML_ARTICLE_REFERENCE_CHECK_2026-10-11.json` for all 81 reachable reference URLs. Preserve the existing unrelated dirty work.

Updated: 2026-10-11

The member portal UX pass adds shared grouped navigation, a visible command palette, reachable mobile account controls, a dashboard with urgent actions near the top, immediate checklist dismissal, and a searchable/filterable evidence log with per-project in-memory drafts. Verification: 184 local tests (1,217 assertions), final typecheck, full-repository lint, and diff checks pass; the final focused portal/auth rerun also passes all 19 tests. Browser automation timed out twice under memory pressure; the isolated preview was stopped and its fixture files removed. Full build, live role flows, and deployment were not performed in this pass. See `docs/MEMBER_PORTAL_UX_2026-10-11.md` for the exact scope and remaining checks. Preserve the concurrent public portfolio/manifest work.

The public portfolio now has a deterministic machine-readable companion at `/portfolio-manifest.json`. It is generated from the same typed projections as `/network` and `/research-atlas`, and contains all 6 verified destinations, 20 canonical source identities, 33 research lines, stable public profile URLs, the E0–E8 evidence legend, source revision metadata, limitations, and claim boundaries. It deliberately excludes local filesystem paths, credentials, and inferred source links. `bun run manifest:check` fails on drift, the release gate runs that check before deployment configuration, and both public indexes expose a direct JSON download. Local verification passes typecheck, 179 tests with 1,197 assertions, 27-route smoke, research-state validation, high-severity dependency audit, targeted lint for this slice, development client/SSR builds, browser rendering, and an HTTP 200 JSON response check. The full repository lint is currently blocked only by one Prettier formatting error in concurrently added `src/lib/member-navigation.ts`; that file was not altered in this portfolio pass.

The public `/network` directory now has shareable URL search and classification filters, keyboard focus, filter totals, live result counts, and an explicit resettable empty state. The public sitemap is generated from the 20 canonical portfolio identities and 33 research-atlas records; `bun run sitemap:check` fails on drift, duplicate coverage is test-bound, and authentication/member routes remain excluded. The release gate runs sitemap and critical-route checks before its production configuration checks. Browser QA confirmed the three unresolved identities, a single NeuroCAD search result, and the zero-result recovery path. Local verification passes typecheck, lint, 176 tests with 1,131 assertions, 27-route smoke, research-state validation, high-severity dependency audit, and sitemap synchronization. Production remains blocked on Supabase configuration and live role verification.

The complete 33-line BU1LD public research atlas has been recovered from the later canonical `the-bu1ld-nexus` source and integrated at `/research-atlas`. Every line now has a stable `/research-atlas/<slug>` page with kind, stage, public status, summary, tags, evidence boundary, and only verified repository/control-plane links. Atlas search and filters persist in shareable URLs, `/` focuses search, empty states reset cleanly, and four guided paths expose memory, JEPA, scientific-ML, and foundry work without inventing extra projects. Detail pages rank related work by shared tags and stage; portfolio profiles link back only where an explicit identity mapping exists. The atlas remains separate from the 20-identity product/source network because the two registries answer different questions. Public navigation, footer, `/network`, sitemap, route smoke, and tests include the atlas. Local verification passes typecheck, lint, 171 tests with 1,063 assertions, 27-route smoke, research-state validation, high-severity dependency audit, client/SSR development builds, URL-state/browser QA, and browser console checks. The refreshed preflight reports zero broken local Markdown links for BU1LD. Deployment is still blocked by missing Cloudflare authentication, production Supabase configuration, dirty-state review, and multi-role live verification.

All 20 canonical identities now have a stable public profile route at `/portfolio/<project-id>`, and every `/network` card links to its profile. The profiles publish only browser-safe registry facts: classification, evidence level, source status, category, objective, current implementation, intended output, limitations, and verified public links. ESNF, NFGM, and the visualization scratch record remain explicitly unresolved; MonteCarlo remains an empty archive. The sitemap includes every profile. Local verification passed 165 tests, 729 assertions, typecheck, lint, 25-route smoke, client/SSR development builds, and HTTP 200 checks for all 20 profile URLs. The pages are not yet deployed because this shell has no Cloudflare API token or production Supabase URL/anon key; do not bypass those release guards.

The public `/network` route now links the reachable BU1LD, FinanceMeta, and VertexED fallback destinations; keeps Obscured Records owner-only; and projects all 20 canonical identities without shipping local filesystem paths. The projection is test-bound to `research/SOURCE_BINDINGS.json`. FinanceMeta's homepage footer now links back to the live BU1LD root without merging the two brands. On 2026-10-11, The BU1LD, FinanceMeta, and VertexED fallback URLs returned HTTP 200, while `www.vertexed.app` still failed TLS and was deliberately excluded. Recheck availability before changing any live/preview label.

## Immediate next step

Read `research/project-states/<project-id>/STATE.json` and `HISTORY.jsonl`, then advance the first eligible item in `research/pipeline/ACTION_QUEUE.json` without crossing its checkpoint gate. Source binding is complete for 17 of 20 identities; ESNF, NFGM, and the obsolete visualization scratch record remain unresolved. Do not claim scientific completion from initialization, source discovery, engineering checks, or smoke tests.

The finite 24-hour continuation is active through 2026-10-11 22:48 Asia/Kolkata at 30-minute intervals. Every run must pass the resource/ownership guard before mutating anything and must not create a competing writer.

The member portal now includes `/workspace`, a unified evidence log built on the existing `project_memberships`, `project_milestones`, and `project_contributions` controls. It deliberately distinguishes submitted, verified, and needs-changes records, supports revision/resubmission, and exports the signed-in member's contribution log. Do not replace it with a second evidence schema.

Signed-out browser QA also found and fixed a guard loop that repeatedly nested `/login?redirect=...`. Private routes now capture their original destination once, replace browser history on redirect, and `/workspace` is a typed post-auth destination.

The local high-severity dependency audit and frozen-lockfile install pass after the dependency refresh. Typecheck, lint, 164 tests, 24-route smoke, research-state validation, and both development client/SSR builds also pass. The production build remains intentionally blocked until the deployment Supabase URL and anon/publishable key are supplied.

## External / live queue

1. Review/rehearse the chain through phase40 on the intended Supabase project, applying only missing phases to an existing database; run `VERIFY_SETUP` and retain its output.
2. Configure production secrets, Auth Site URL / redirects, OAuth, email/digest/deletion endpoints.
3. Run multi-account role smokes: visitor → member → project lead → reviewer → admin.
4. Run `BU1LD_RELEASE_STRICT=1 bun run release:check` in the deployment environment.
5. Confirm published project rows exist so the public catalog is not empty by omission.
6. Exercise `/workspace` with contributor, lead, reviewer, and admin accounts: verify membership isolation, self-review denial, revision/resubmission, verified-only public visibility, and export accuracy.

## Research pipeline queue

1. Reconcile bound repository-owned protocols, decisions, failures, negative results, and evidence pointers into each canonical project state.
2. Resolve ESNF and NFGM only from authoritative source identity; leave them E0 otherwise.
3. Keep PI-JEPA marked as recovered source and IPII partially unresolved until independent identity evidence exists.
4. Define exact questions, falsifiers, development budgets, compute budgets, and protected-evaluation boundaries before Checkpoint 1 can advance.
5. Keep products and archives on product/archive gates instead of forcing a paper lifecycle.

## Do not do

- Do not invent partners, benchmarks, user counts, or experimental project statuses.
- Do not reintroduce cinematic intro gates or decorative per-second clock re-renders.
- Do not index `/login`, `/signup`, or member surfaces in the sitemap.
- Do not commit or push unless the owner explicitly asks.
- Do not open protected outcomes before Checkpoint 7 is frozen.
- Do not overwrite canonical state or delete append-only history.
