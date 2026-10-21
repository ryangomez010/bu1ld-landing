> Current status (2026-10-21): [local fixes and remaining acceptance work](COMPLETION_2026-10-21.md). Migration target: **phase40**. Production remains blocked; older phase counts and completion statements below are historical.

# Current Pass Context

## Pass / Governor

**Phase 4** — institution credibility + journey completion + security integrity layered on Phases 1–3.

## Verified this session

- Public Apply / Programs CTAs hand off through signup/login/`redirect` into `/programs/$slug` or `/competitions`
- Deep-link auth for member routes; lead application questions; research→project bridge
- Skills matching + weekly commitment hours (phase29)
- phase28 public output archive on `/evidence` (verified claims + public milestones/contributions)
- Public `/projects` discovery before auth; project-specific signup/login return path
- phase30 public catalog column grants + server-side project brief/resource validation
- **phase31** closes competition/invitation/deliverable/contribution/membership/claim bypasses; seeds published program cycles
- Paper detail → related open projects; research hub always shows projects section (with empty state)
- Lead workspace: experiment status controls + deliverable accept/revision; accepted app CTA to evidence
- Browser QA: desktop + mobile project discovery/navigation; fixed root analytics route crash
- Route tree regenerated (`/announcements` included)
- Public portfolio system: 20 identity profiles, 33-line research atlas, registry-generated sitemap, and deterministic downloadable JSON manifest with drift/privacy tests
- Current local verification: **179 tests / 1,197 assertions**, typecheck, 27-route smoke, research-state validation, dependency audit, targeted lint, and development client/SSR build pass. Full lint is blocked by one Prettier formatting error in concurrent member-navigation work; `release:check` is correctly blocked by absent production Supabase configuration.

## Exact next task

> Owner: apply FINAL_SETUP through **phase34**, publish/confirm live program cycles, run `release:prod` + multi-account smokes. Cursor: commit only if requested; optional credentialed Playwright E2E.

## Canonical memory

[PROJECT_MEMORY.md](./PROJECT_MEMORY.md) · [PROJECT_STATUS.md](../PROJECT_STATUS.md) · [Portfolio persistent memory](../research/PERSISTENT_MEMORY.md) · [Next handoff](./NEXT_HANDOFF.md)
