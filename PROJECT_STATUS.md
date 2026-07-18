# Project status

**Date:** 2026-07-18
**Branch:** `main`
**Governor phase:** 4 (Release candidate)
**Focus:** Institution credibility + main journeys + public evidence archive

## Verified complete (local)

- typecheck / lint / **130 tests** / smoke / build / `release:check`
- Schema through **phase32** in repo (`FINAL_SETUP.sql`)
- phase32 independently enforces no contribution self-review/self-reviewer assignment
- Leadership overview surfaces review backlog, overdue milestones, owner gaps, and stalled projects
- Member/account export includes contribution evidence and verification state
- phase31 RLS/RPC integrity (competition review, invitation accept, deliverable review, membership, claims evidence, collaborator-scoped experiments/datasets)
- Paper→project bridge; lead experiment/deliverable review UI; accepted-app workspace CTA
- Public → auth → member program apply funnel with safe redirects
- Program pages state objective, audience, commitment, timeline, selection, status, outputs, CTA
- Homepage without fake KPIs / anonymous team / newsletter-as-startup CTAs
- Competitions labeled as catalog preview when seed-only
- Labs catalog available even when DB empty
- Partnership inquiry drafts a real mailto
- Institution mobile Sheet nav; OG meta improved
- `/evidence` shows verified institutional claims + public project outputs (honest empty states)
- Builder discovery shows skills + weekly commitment hours
- Visitors can browse published projects before authentication and hand off to signup/login with a safe return path
- Project edits are validated client-side and by the phase30 database trigger; private resource links are not granted to anon
- Lead management/edit pages explicitly reject projects owned by another lead
- `/announcements` registered in route tree

## Implemented but partially verified

- Live program applications require published DB program rows
- Competition submissions require live open rows (not seed IDs)
- phase26–32 must be applied on staging Supabase

## Externally blocked

1. Apply `FINAL_SETUP.sql` through phase32
2. Secrets + `release:prod`
3. OAuth / storage / email
4. Multi-account role smokes

## Not completed

- Full Playwright browser E2E
- Startup CRM / experiment immutability

## Quality gates

```bash
bun run typecheck && bun run lint && bun run test && bun run smoke && bun run release:check && bun run build
```
