# Next Handoff

Updated: 2026-10-11

The public `/network` route now links the reachable BU1LD, FinanceMeta, and VertexED fallback destinations; keeps Obscured Records owner-only; and projects all 20 canonical identities without shipping local filesystem paths. The projection is test-bound to `research/SOURCE_BINDINGS.json`. FinanceMeta's homepage footer now links back to the live BU1LD root without merging the two brands. On 2026-10-11, The BU1LD, FinanceMeta, and VertexED fallback URLs returned HTTP 200, while `www.vertexed.app` still failed TLS and was deliberately excluded. Recheck availability before changing any live/preview label.

## Immediate next step

Read `research/project-states/<project-id>/STATE.json` and `HISTORY.jsonl`, then advance the first eligible item in `research/pipeline/ACTION_QUEUE.json` without crossing its checkpoint gate. Source binding is complete for 17 of 20 identities; ESNF, NFGM, and the obsolete visualization scratch record remain unresolved. Do not claim scientific completion from initialization, source discovery, engineering checks, or smoke tests.

The finite 24-hour continuation is active through 2026-10-11 22:48 Asia/Kolkata at 30-minute intervals. Every run must pass the resource/ownership guard before mutating anything and must not create a competing writer.

The member portal now includes `/workspace`, a unified evidence log built on the existing `project_memberships`, `project_milestones`, and `project_contributions` controls. It deliberately distinguishes submitted, verified, and needs-changes records, supports revision/resubmission, and exports the signed-in member's contribution log. Do not replace it with a second evidence schema.

Signed-out browser QA also found and fixed a guard loop that repeatedly nested `/login?redirect=...`. Private routes now capture their original destination once, replace browser history on redirect, and `/workspace` is a typed post-auth destination.

The local high-severity dependency audit and frozen-lockfile install pass after the dependency refresh. Typecheck, lint, 164 tests, 24-route smoke, research-state validation, and both development client/SSR builds also pass. The production build remains intentionally blocked until the deployment Supabase URL and anon/publishable key are supplied.

## External / live queue

1. Apply `FINAL_SETUP.sql` through phase34 on the live Supabase project; run `VERIFY_SETUP`.
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
