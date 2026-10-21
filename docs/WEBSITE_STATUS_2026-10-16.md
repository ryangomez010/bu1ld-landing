# BU1LD website — master execution handoff, 2026-10-16

**Local implementation is substantial; acceptance and public launch remain incomplete.** Current candidate: `main` at `134f63fb10741f695cc29210e40b3ac3b5ea4e09`, with uncommitted changes. No commit, push, production migration, upload, real form submission or deployment occurred. Worldcastr was not inspected. This section and `masterExecution` in [the verification receipt](WEBSITE_VERIFICATION_2026-10-16.json) supersede current counts in the preserved earlier reports below.

## Delivered locally

- **Research:** 40 public pages representing 32 canonical projects, one subproject, six collections and one unresolved direction. The [coverage ledger](../research/coverage/PROJECT_COVERAGE_2026-10-16.json) reconciles 52 records and 20 source identities, preserving aliases, private exclusions, unresolved identities and negative evidence. APEN, LAM-JEPA, Krylov-JEPA, FIM, ATG, Space-JEPA, SIDEREA, NeuroCAD, Olympus and the remaining atlas records have questions, methods, evidence limits and next steps. All 40 have relevant preparation lessons. Homepage descriptions and statuses derive from those same records; FIM's verified repository link is consistent.
- **Learn:** 120 original articles and six essays retained; 30 lessons deepened and 18 added. There are 144 public entries, including **48 structured lessons across 12 tracks**, with 21,454 structured body words. [Twelve CPU exercises](../public/learning/verification.json) passed on Python 3.14.7 without installs, model downloads or paid services. See [curriculum coverage](learning/CURRICULUM_COVERAGE_2026-10-16.json).
- **Papers:** 150 unique candidates discovered, 109 full texts fetched, and **100 full-text-read, source-checked reviews** written: 86,580 original body words, 770–1042 per review. All are within the recorded 30-day discovery window. One failed retrieval remains preserved and was replaced. The [all-review receipt](../research/paper-reviews/validation.json) passes structural, date, source-checksum and citation-locator checks. **100 editorial-pending, zero human-approved, zero published.** Reading sources is not independent reproduction. Two hundred related-lesson links cover 65 lessons. The [private draft export](../research/paper-reviews/exports/README.md) maps all 100 to hosted draft fields without uploading or inventing human approval.
- **Public journeys:** loader-backed public learning, papers, events, search and participation; native GET filters; explicit unavailable/partial/verified-empty states; public metadata projections; individually loaded approved bodies. Homepage project/review/event previews share those catalogs with short read deadlines. Research and startup cards remain visible without JavaScript. Counts derive from canonical records. The Q2 cohort is closed locally; program formats are interest-only with unconfirmed operational details.
- **Participation and administration:** ten current interest paths and one historical archive, URL filters and device-only saved interests. Phase35 implements event editing, capacity, waitlist, idempotent RSVP/cancel receipts and confirmed-date ICS. Phase36 implements private editorial evidence, human attestation, separate approval/publication and stale-decision protection. Both migrations are **unapplied**. See [editorial operations](PAPER_EDITORIAL_WORKFLOW.md). Analytics hooks use coarse, sanitized fields and confirmed persistence for success events; live analytics remains unconfigured. Saved-paper writes now expose failure instead of claiming success.

## Verification and remaining gates

| Gate | Current evidence |
| --- | --- |
| Local suite | **308 passed, 0 failed, 6,061 assertions across 65 files** |
| Lint and generated artifacts | Full repository ESLint with 192 MiB heap, guide catalog, sitemap, portfolio manifest, research coverage and diff whitespace pass |
| Static routes and links | 34 critical routes; no missing static record/artifact or invalid review relation in audited scope. 148 external destinations reachable; one MIT Press URL returns HTTP 403 and remains access-restricted. [Exact scope and probe history](WEBSITE_LINKS_2026-10-16.json) |
| Papers and export | All 100 validate; offline export is synchronized. Structural PASS does not confer editorial approval |
| Full typecheck/build/preview | **BLOCKED / NOT RUN** under the host resource gate; no fresh compiled-release claim |
| Browser/accessibility/performance | **NOT RUN** for the new candidate: specified widths, 200% zoom, actual no-JavaScript HTTP, focus/screen-reader checks, real 404/redirects and web-vital measurements. No durable before/after screenshot pair exists |
| Database, roles and providers | **NOT RUN**: isolated phase35/36 SQL contracts, concurrency, live RLS/ownership, application/registration receipts, callbacks, cancellation and email. Guard checks opened no DB connection |
| Strict release | Exits 1 on missing production Supabase/client/database/server/email configuration before compiler/build |
| Public launch | **BLOCKED** by the above verification, human review/publication authorization and separate release authority |

Latest resource sample: 112.453 MiB free plus speculative memory against the 512 MiB floor, pageouts 1,057,171. Sustained admission was not established. An earlier system-volume ENOSPC failure and all substantive failed checks are retained in the receipt; available disk space is now 3.48 GiB system / 193.19 GiB workspace. No unrelated processes or data were removed.

The Tally intake at `https://tally.so/r/1AeYbO` rendered “The Bu1LD — Fall 2026 Research Tracks” during read-only inspection. That establishes a reachable form, not open intake, available reviewers, submission success or membership. No confirmed upcoming-event total is claimed without the operational backend. Owner confirmation is still needed for dates, capacity, compensation, reviewer availability and actual program openings.

## Exact continuation and rollback

1. Preserve this dirty candidate. The verification receipt contains all current source hashes and working-tree paths, explicitly including pre-existing user work. Starting snapshots are `/private/tmp/bu1ld-execution-20261016/starting-status.txt` and `starting-tracked.patch`. Main implementation paths are `src/routes/{index,forms,search,guides,papers,events,research-atlas}`, `src/components/{landing,member,admin,events}`, `src/data/research-portfolio.ts`, `src/content/guides/`, public catalog/event/editorial helpers, `research/coverage/`, `research/paper-reviews/` and `supabase/phase35.sql` / `phase36.sql`.
2. Once resource admission permits one heavy worker, run `rtk proxy bun run typecheck`, `rtk proxy bun run build` with valid local configuration, then start the preview and capture the required browser matrix. Recheck static/native controls in actual HTTP and browser execution. Historical builds do not certify this fingerprint.
3. Connect the intended isolated BU1LD backend; inspect its migration ledger and target identity. Apply only necessary migrations with explicit authority, never the whole setup blindly. Run the rollback-only event/editorial contracts, `supabase:verify`, `supabase:rls` and distinct-account journeys. Use authorized test-provider facilities, not real organizers or capacity. Then perform human review of the 100 private drafts and authorize each publication explicitly.
4. Production remains `the-bu1ld-nexus` / `thebu1ld.com`. Configure the required runtime secrets in the proper secret manager, obtain separate release authority, run strict release, deploy through the guarded pipeline and verify the deployed revision. Discovery tooling is prepared, but **no scheduled refresh is enabled or verified**.

Keep the private review corpus, offline export and cached third-party sources out of public source uploads until their publication is authorized. No DB rollback is needed because phase35/36 were never applied. For local rollback, compare this pass with the starting patch and selectively restore only its changes; never reset the tree or erase pre-existing untracked work. After a future migration, retain registration records, editorial audit history and fail-closed publication guards; restore a compatible UI/RPC pair or use a reviewed forward repair rather than blindly dropping tables or security rules. SQL verification scripts roll back only their synthetic fixtures.

## Preserved earlier iteration report


The local completion pass is implemented and regression-checked. The website is **not yet production accepted**: the full application compiler, production build, browser journeys, and connected role checks remain open. The user selected this BU1LD-Web checkout as the production successor and explicitly requested local coding followed by waiting for connection. No commit, push, database mutation, live account deletion, or deployment was performed.

## Current product inventory

| Area | Current local implementation | Evidence and remaining boundary |
| --- | --- | --- |
| Public institution | Homepage, responsive shared navigation, application paths, six labs, programs, competitions, people, partnerships, publications, evidence, privacy and terms | Existing pages preserved; this pass repaired discovery and data-loading/error journeys. Backend-fed content needs the correct live project and browser acceptance. |
| Portfolio and research | 20 canonical portfolio profiles, 33 research atlas records, searchable directories, public sitemap and machine-readable portfolio manifest | Registries and generated artifacts are synchronized. Unknown static IDs use the router's not-found boundary; actual server HTTP status still needs build/browser verification. Research claim/evidence boundaries remain intact. |
| Learning library | 120 ML articles across 10 ordered paths plus 6 reference essays; search, URL filters, progress filters, resume and completion controls, lazy article bodies, sources | All 126 pieces include exercises with answer checks. ML body total: 35,625 words. Catalog/body invariants and bounded content compiler pass. No saved slugs/order were removed. |
| Member experience | Dashboard, workspace evidence log, projects/applications, saved collections, papers/research, events, newsletter, jobs/tracker, member profiles, notifications and account preferences/security | Existing features retained; account/project draft isolation, loading failures, redirect state, and destructive-action reporting repaired. Mocked/local tests do not certify real member/lead/reviewer/admin privileges. |
| Release path | This checkout now locally targets the existing `the-bu1ld-nexus` Worker and `thebu1ld.com` domain, through the generated-output wrapper | Deployment commands and workflow require strict checks, matching Supabase project identity, verified database TLS, and Worker binding names. No upload or routing change happened. |

## Work completed in this iteration

- Added 20 ML articles (two per path), substantially revised 10 originals and all 6 essays, then read every ML body and completed the remaining 90 answer sections. The latest content pass added 6,875 answer words, replaced 12 vague exercises with concrete tasks, and corrected two technical explanations. Sources, metadata, previous slugs and path order were retained.
- Added native collapsed answer disclosures and unique heading anchors. Library links preserve filters and reach the learning-path section. Completion controls use the same 95% threshold as the catalog. Malformed array filters are rejected. Slow progress loads retain newer local writes and do not overwrite newer save status.
- Improved network/atlas filtering, touch targets, keyboard behavior, detail/back navigation and missing-record handling. Labs load their descriptions independently of project availability. Publications/evidence distinguish unavailable, partial, cached, and confirmed-empty data, with bounded requests and retries.
- Repaired signup confirmation, OAuth/password-reset code ownership, callback destination/query/hash restoration, stale account/profile requests, role/profile loading failures, onboarding validation and draft isolation, sign-out errors, workspace drafts, and project-application answer persistence.
- Repaired account deletion so configuration/session checks precede irreversible scrubbing, the server orders scrubbing and Auth removal, and only an explicit receipt counts as complete. Partial or uncertain failure stays visible for retry. Client and handler changes must deploy together.
- Corrected release configuration loading, privileged-public-key rejection, runtime key precedence, real Auth API probing, full catalog/RLS-flag coverage, namespace joins, TLS validation, project identity checks, explicit migration selection, deployment prerequisites, and same-origin email endpoint support.

Detailed scope: [articles](ARTICLE_COMPLETION_2026-10-16.md), [public pages](PUBLIC_COMPLETION_2026-10-16.md), [member flows](MEMBER_COMPLETION_2026-10-16.md), [release tooling](RELEASE_TOOLING_2026-10-16.md). The earlier expansion receipt remains in [ML_ARTICLE_EXPANSION_2026-10-15.md](ML_ARTICLE_EXPANSION_2026-10-15.md).

## Fresh verification

| Check | Result |
| --- | --- |
| Complete local test suite | **248 passed, 0 failed, 4,299 assertions across 53 files** |
| Full repository ESLint | Passed with 192 MiB heap cap; final touched-file lint also passed |
| Scoped strict content/catalog/generator TypeScript | Passed with 128 MiB heap cap; this is not the full application compiler |
| Article catalog | 120 articles, 10 tracks, 35,625 ML body words; synchronized |
| Public sitemap and portfolio manifest | Synchronized |
| Critical-route static smoke | 29 critical paths present; this is source coverage, not HTTP/browser verification |
| Arithmetic/content review | 30 arithmetic assertions and article identity/field-preservation checks passed |
| Diff whitespace | Passed |
| Strict release command | Correctly blocked before compiler/build by absent production configuration, after the four generated/static checks passed |

One aggregate run initially failed because older tests left a blank Supabase environment value in Bun's shared environment, masking the test's dotenv fixture. The fixture now uses isolated test-specific names and individual assertions; the final aggregate run passes. Earlier receipts and this failure boundary were not recast as successes.

Full build, full semantic application typecheck, dev server, browser automation and dependency installation were not started in this pass. Free plus speculative memory remained below the repository's 512 MiB admission floor (latest 181.375 MiB), with pageouts rising from 811,457 to 827,050 during sampled checks. Previous successful builds/compiler runs belong to older source snapshots and do not certify this one.

## Live snapshot and explicit next work

A read-only HTTP snapshot of `https://thebu1ld.com/api/health` identified service `the-bu1ld-nexus`, revision `3fe04bf8afc0043453dd967e3e0eb3f72428b228`. `/network`, `/research-atlas`, and `/apply` returned 404; `/`, `/projects`, `/guides`, `/workspace`, `/login`, and `/signup` returned 200. An HTTP 200 on a private route does not certify authentication or authorization. See [the exact route receipt](LIVE_ROUTE_AUDIT_2026-10-16.json).

The connected Supabase management account exposed VertexED only. No BU1LD public client configuration, DB connection, service-role key, email/digest secrets, or Cloudflare deployment credentials were available. The user requested waiting for connection, so no alternate project was used.

When the connection is supplied and host resource admission permits:

1. Connect the intended BU1LD project and provision public/client and server/runtime configuration in the correct secret manager. Inspect the actual migration ledger, schema and policies; apply only required schema work after confirming the target, then run the schema/API checks. Do not run the complete setup blindly against an existing production database.
2. Run full semantic compilation, production build and browser QA at narrow/mobile, tablet and desktop widths. Check navigation/filters, Back/Forward, focus, disclosures, empty/error/retry states, and actual missing-profile HTTP status/metadata.
3. Exercise member/lead/reviewer/admin journeys with distinct accounts: confirmation/OAuth/recovery, onboarding, saved/progress state, workspace and application isolation, membership access, self-review denial, public verified-only output, and role escalation denial.
4. Verify real email and digest delivery/configuration. Verify deletion only on an explicitly disposable account, including pre-scrub configuration failure and partial finalization recovery.
5. Run the strict release command and guarded deployment against the approved Worker, then verify the deployed revision/routes and repeat critical smoke journeys. The current instruction is to wait before this connected phase.

No percentage is assigned to production completion: the remaining gates are functional acceptance requirements, not cosmetic polish.

## Source checks used for technical edits

The precision/recall correction follows [scikit-learn's precision-recall explanation](https://scikit-learn.org/stable/auto_examples/model_selection/plot_precision_recall.html). The pure covariate/label shift assumptions follow [Dive into Deep Learning](https://en.d2l.ai/chapter_linear-classification/environment-and-distribution-shift.html). These checks support the educational edits; they do not add external validation to any BU1LD research project.
