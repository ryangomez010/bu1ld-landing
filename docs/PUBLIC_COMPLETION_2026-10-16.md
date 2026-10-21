# Public website completion pass — 2026-10-16

This pass repaired concrete public journeys in the existing dirty BU1LD-Web
checkout. It preserves the October 15 navigation, application, portfolio, and
article work. It does not certify production, change a research claim, apply a
database migration, commit, push, or deploy.

## Repairs

| Finding | Change | Evidence |
| --- | --- | --- |
| Network and research-atlas filters could reset scroll on every keystroke; opening a detail page discarded the directory context. | Search/filter updates explicitly retain scroll. Index, detail, previous/next, and return links carry the validated search state within their own registry. | Shared-search encoding/default/length tests; source inspection. Browser history/scroll behavior still needs browser QA. |
| Global `/` search shortcuts could intercept composition, browser shortcuts, textarea/select input, and editable regions. | One tested guard respects consumed events, modifier keys, composition, key repeats, native inputs, and editable ancestors. | Positive and negative keyboard-event tests. |
| Network/atlas filter and reset controls were small touch targets. | Controls now have a 44 px minimum height; filter groups have explicit group semantics; query inputs enforce the same length limit as their parser. | Changed-file lint and source inspection. Visual/keyboard QA remains open. |
| Missing static portfolio/atlas identifiers rendered a normal empty profile. | Route loaders now throw TanStack's `notFound`, retain a useful recovery page, and supply noindex metadata for unknown records. | Router tests confirm `notFound` match state for unknown IDs; all 20 portfolio and 33 atlas entries still resolve. HTTP 404 delivery is not yet browser/server verified. |
| Lab detail waited for both lab and project requests, could retain a previous slug's state, and used the permissive project fallback. | Independent query keys/loaders retain the lab description while the strict public project catalog loads or fails. Error states support retry; no published results and unconfirmed catalog bindings are distinguished. | Existing isolated strict catalog tests and route inspection. |
| Lab pages described all role types and linked work as open. | Role descriptions now distinguish possible contributions from confirmed vacancies; linked work shows Recruiting, Active, or Completed as appropriate. | Source inspection; existing status-label tests. |
| Publications and evidence could spin indefinitely after a rejected request and treated unavailable service as an intentionally empty register. | Public consumers now opt into strict fetch errors, bounded requests, loading/error/retry states, and warnings when cached records remain. Claims and project outputs load independently. | Isolated mocked tests cover missing service, empty success, populated success, database errors, thrown timeouts, one failed output branch, and failed published-project joins. |
| Public publications could substitute development seed reviews. | Strict public fetches return only successful service rows, including a genuinely empty result. Defaults for existing helper consumers remain compatible. | Tests exercise strict empty results while demo fallback is enabled and confirm the legacy fallback still exists. |

No schema, RLS policy, role privilege, review eligibility, or publication predicate
was changed. Existing predicates still require published reviews, verified claims,
completed public milestones, verified public contributions, and published parent
projects. The tests check those query predicates; they do not prove live RLS.

## Fresh verification

- `rtk proxy bun test src/lib/public-discovery.test.ts src/lib/public-record-loading.test.ts src/lib/research-atlas.test.ts src/lib/portfolio-network.test.ts src/lib/project-catalog.test.ts src/lib/project-discovery.test.ts src/lib/landing-release.test.ts src/lib/project-collaboration.test.ts` — **40 passed, 0 failed, 782 assertions** across eight files.
- ESLint passed all 15 changed TypeScript/TSX files in this pass under a 192 MiB Node heap cap.
- Prettier ran on the changed files; `rtk git diff --check` passed.
- An initial router test incorrectly expected the installed router version to expose `state.statusCode`; it failed and was corrected to assert the supported `notFound` match state. This pass does not claim an observed HTTP status.

## Outstanding verification and release work

The host remained below the 512 MiB free-plus-speculative admission floor at
dispatch. No build, development server, browser session, dependency installation,
or full semantic compiler was started by this pass.

When resource admission and deployment access are available:

1. Run the repository's semantic typecheck and build. Inspect `/network`,
   `/research-atlas`, `/labs`, `/publications`, and `/evidence` at 320, 768, and
   1280 px.
2. Exercise filter changes, detail/back/previous/next journeys, the `/` shortcut,
   keyboard focus, browser Back/Forward, and malformed shared URLs. Confirm scroll
   stays stable while typing.
3. Confirm successful and missing static profile requests return the intended HTTP
   statuses and metadata through the actual server/Worker.
4. Exercise live empty/error/retry paths for publications, claims, and outputs;
   confirm one failing evidence source does not hide the other. Check lab catalog
   fallback and linked-project availability against the correct BU1LD database.
5. Complete the existing live authorization, source-identity, and strict release
   gates before production delivery. These local repairs do not resolve missing
   deployment credentials, live schema/RLS checks, or the distinction between this
   checkout and the Worker serving the current site.
