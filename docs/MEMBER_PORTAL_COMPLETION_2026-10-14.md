# Member portal and ML library — 2026-10-14

The requested portal and article work is implemented locally. Production release is blocked by missing deployment configuration and BU1LD database access. Build, browser, and live role verification remain outstanding; this report does not certify a deployment.

## Delivered experience

- The member shell groups work, discovery, and library destinations, supports mobile navigation and keyboard access, and exposes the command palette. The dashboard prioritizes pending actions. The evidence workspace supports combined search/status filters, revision actions, submission feedback, and separate in-memory drafts for each project.
- The library includes 100 distinct short ML articles across ten topics plus the six existing reference essays. Each new article includes a concept, example, common trap, exercise, and primary further-reading references. The collection totals 22,233 body words. See the [complete inventory](ML_ARTICLE_LIBRARY_2026-10-11.md).
- Ten ordered learning paths now offer the next unfinished article, reading time, and completion counts. Search, topic, level, reading status, and expanded result count persist in the URL. Opening an article, moving to the next article, and using the reader's back link retain the originating library view.
- Article bodies load independently of the account-progress request. Readers support resume, explicit completion, content-based progress, loading failures, retry, and topic browsing. Article bodies remain split into ten on-demand chunks.
- Progress saves locally immediately and debounces account writes. The persistence layer merges newer device/account values, serializes writes within this client, retains progress after failed requests, and handles blocked browser storage. Reads and writes have a ten-second timeout each. The UI distinguishes synced, device-only, saving, and unavailable states; it never treats a failed remote write as a confirmed account sync.
- The production gate now checks the 100-article catalog and both guide routes. A bounded TypeScript command checks every application source file using the installed compiler and unchanged project settings, with sequential workers capped at a 512 MiB JavaScript heap.

No database schema or RLS policy was changed. The existing `reading_progress` table, owner filter, and composite upsert key remain in use. Client serialization does not provide atomic conflict resolution between simultaneous writes from different devices. Pending device-only progress can be retried from the reader. Workspace drafts still last only while that page remains open.

## Fresh verification

| Check                                                                         | Result                                                                            |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `rtk proxy bun test src/lib/*.test.ts`                                        | 201 passed, 0 failed, 2,802 assertions across 41 files                            |
| `rtk proxy node --max-old-space-size=512 node_modules/eslint/bin/eslint.js .` | Passed, full repository                                                           |
| `rtk proxy bun run typecheck:bounded`                                         | Passed across all 341 application source files with unchanged TypeScript settings |
| `rtk proxy bun run guides:check`                                              | 100 articles, ten tracks, 22,233 body words; metadata synchronized                |
| `rtk proxy bun run sitemap:check`                                             | Passed; private routes remain excluded                                            |
| `rtk proxy bun run manifest:check`                                            | Passed                                                                            |
| `rtk proxy bun run smoke`                                                     | 29 critical route definitions present; this is a static check                     |
| `rtk proxy git diff --check`                                                  | Passed                                                                            |
| Article-file hashes against the reference-check receipt                       | All ten files unchanged                                                           |
| `rtk proxy bun run release:prod`                                              | Blocked on configuration after the preceding artifact and route checks passed     |

The [verification receipt](MEMBER_PORTAL_VERIFICATION_2026-10-14.json) retains command output, the corrected routing-type failure, the final passing compiler run, and a digest of 405 source/configuration files.

The new persistence tests exercise corrupt values, account isolation, local/remote merging, failed reads and writes, blocked storage, quota failure, and overlapping requests. Catalog tests load every article and check filtering, URL recovery, and the ten learning paths. These tests use injected storage and transport boundaries; they do not verify live Auth or database authorization.

The [reference receipt](ML_ARTICLE_REFERENCE_CHECK_2026-10-11.json) records 81 successful URL checks on October 11. The matching body hashes were rechecked on October 14. The URLs were not all fetched again in this pass, and link availability is not independent expert review of article content.

## Remaining release work

1. Restore authorized access to the BU1LD Supabase project. The connected account listed only VertexED; the direct BU1LD project lookup was denied. Supply deployment configuration through the appropriate environment or secret manager: Supabase URL and public key, database verification credentials, server-only service-role key, Resend key, digest secret, and email endpoint. Do not place server secrets in `VITE_` variables.
2. Reconcile the canonical production source and target before deployment. This checkout names `bu1ld-landing` in Wrangler; the October 11 production receipt identified `the-bu1ld-nexus` from another checkout. A current health-endpoint lookup through the web tool could not confirm the live identity. No deployment was attempted.
3. With stable resource headroom, run the full application build and authenticated browser QA on this source. This host remained under memory pressure; a full Vite build or new browser/server workload was not started. The bounded compiler pass is not bundle or browser evidence.
4. Verify the live schema/RLS and exercise visitor, member, contributor, lead, reviewer, and admin flows. Cover membership isolation, self-review denial, revision/resubmission, verified-only public visibility, exports, navigation focus, URL filter recovery, and reading progress across refresh/account changes/offline retry.
5. Run the strict production gate in the correctly configured deployment environment, then verify the deployed revision and live routes.

The checkout contains pre-existing public portfolio and research changes. They were preserved. No commit, push, deployment, schema mutation, or production member-record change was made during this pass.
