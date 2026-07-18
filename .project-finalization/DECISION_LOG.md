# Decision log

## 2026-07-18 — Canonical product

The Bu1ld Nexus is the canonical institution/member platform. This pass does not touch sibling portfolio repositories.

## 2026-07-18 — Six divisions

Preserve the six existing lab slugs as the canonical division taxonomy. “Lab” is the product term; division is explanatory language only.

## 2026-07-18 — Evidence before status

Project and institutional outcomes remain public only when published and evidence-approved. Empty states are preferable to synthetic metrics or fabricated completion claims.

## 2026-07-18 — Independent contribution review

No contributor may review their own submission, even when they are also a lead or administrator. Exceptional self-verification is intentionally unsupported.

## 2026-07-18 — Operational analytics first

Admin overview prioritizes queues and blocked work over member/content totals: review backlog, overdue milestones, missing owners, stalled projects.

## 2026-07-18 — Deployment configuration

Do not commit project-specific Supabase values in `wrangler.jsonc`. Local builds use `.env`; CI uses test-only placeholders; production deploy uses repository secrets/environment variables.
