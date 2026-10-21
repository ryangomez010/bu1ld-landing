# BU1LD continuation — 2026-10-21

Status: **local fixes verified; production acceptance remains blocked**. This report supersedes older completion counts and migration instructions for this candidate. Preserve all pre-existing dirty work. No commit, push, database mutation, or deployment occurred.

## Repairs completed

- The combined setup stopped at phase38 although application code depended on phase39. `schema:generate` now builds `FINAL_SETUP.sql` from the existing base plus phases19–40; `schema:check`, the tests, and the release gate reject drift. The base/older migration SQL remains authoritative.
- New forward migration `phase40.sql` scopes all eight mentorship/community tables to authenticated policies and explicit grants. Request participant/content columns cannot be changed by clients; only pending→accepted/declined and accepted→closed transitions are allowed. Mentor availability upserts retain immutable identity, and revoked mentors cannot update availability or decide requests. Lab-lead and institutional-admin access is synchronized with the UI.
- Community moderation can only be changed by administrators. Authors cannot change post identity/channel or undo moderation. Restrictive policies hide comments and reactions under hidden posts and all descendant content under unpublished channels.
- Mentorship reads report unavailable/error states instead of inventing an empty directory. Both pages expose retries, ignore stale load responses, bound network requests, label form fields, and disable actions while pending. The directory excludes zero capacity and self requests. Decision success requires a returned updated row.
- `VERIFY_SETUP.sql` now covers the eight tables, phases39–40, grants, trigger presence/execution restrictions, immutable request columns, and restrictive parent policies. `TEST_MEMBER_FEATURES.sql` adds rollback-only role assertions; its runner accepts only an explicitly designated disposable local database.

## Verification

`rtk proxy bun run test`: **322 passed, 0 failed, 5,554 assertions across 68 files**. Full-repository ESLint passed with no diagnostics. Schema bundle, sitemap, public manifest, guide catalog (120 articles / 10 tracks / 35,625 body words), 34-route static smoke, research-state validation, and diff whitespace checks passed.

The first full suite had one failure because the generator changed the phase36 BEGIN-marker newline convention (321 passed / 1 failed). The generator was corrected; the existing exact-content regression test remains intact. The final suite above passed.

These checks establish local source and client-mock behavior only. **The new SQL has not executed against PostgreSQL**, and the role contract has not run. See the adjacent JSON receipt for file hashes and check boundaries.

## Remaining acceptance work

1. Restore resource admission before full semantic compiler, build, or browser runs. The sampled free-plus-speculative memory was 192 MiB against a 512 MiB floor; pageouts rose from 113,303 to 137,618. The system disk had 175 MiB available. No user processes or files were removed to obtain headroom.
2. Connect the intended BU1LD Supabase environment. The connected account listed only a project named `vertexed25-byte's Project`, which is not authority to reuse it for BU1LD. Local production Supabase/public-key, database, server email/deletion, and digest configuration is absent.
3. Back up and rehearse the schema in an isolated environment. For a fresh database use the complete bundle; for an existing database inspect its applied migration ledger and apply only missing phases in order through **phase40**. Do not replay the fresh-install bundle over an existing database. Phases35–40 have no live application receipt here.
4. On a disposable local database with the complete chain applied, run `BU1LD_DISPOSABLE_DATABASE=yes BU1LD_MEMBER_TEST_DATABASE_URL=<local-url> bun run supabase:test-members`. The current invocation refused before connecting because those settings were absent. Retain actual execution output; SQL text and static assertions are not live RLS evidence.
5. Run `bun run supabase:rls`, strict `bun run release:prod`, and real visitor/member/mentor/lab-lead/reviewer/admin/removed-member journeys, including email, deletion, event registration, workspace evidence, and mentorship/community denial cases. Verify Auth URLs, OAuth, published catalog rows, deployed revision and rollback only in the intended environment.

Human editorial approval for private paper drafts and scientific evidence gates remain separate. This work does not promote portfolio research claims or authorize publication of private drafts.
