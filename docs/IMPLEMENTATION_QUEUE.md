# Implementation Queue

**Frozen at Pass 1 completion (2026-07-17).** Dependency-ordered. Do not reorder without [DECISION_LOG.md](./DECISION_LOG.md) entry.

## Queue

| #   | Priority | Task                                                                                                   | Depends on   | Owner      | Audit IDs        | Status   |
| --- | -------- | ------------------------------------------------------------------------------------------------------ | ------------ | ---------- | ---------------- | -------- |
| Q1  | P0       | Apply Supabase `FINAL_SETUP.sql` + run `VERIFY_SETUP.sql` on staging                                   | —            | Owner      | AUD-002, AUD-003 | BLOCKED  |
| Q2  | P0       | Configure deployment secrets (service role, Resend, digest, email endpoint, account deletion endpoint) | Q1           | Owner      | AUD-001, AUD-005 | BLOCKED  |
| Q3  | P0       | Configure Supabase Auth: Site URL, redirects, OAuth providers                                          | Q1           | Owner      | AUD-004          | BLOCKED  |
| Q4  | P0       | Configure Storage bucket policies                                                                      | Q1           | Owner      | AUD-007          | BLOCKED  |
| Q5  | P0       | Run `bun run release:prod` on staging                                                                  | Q1–Q4        | Owner+Code | AUD-001          | BLOCKED  |
| Q6  | P0       | Execute separate-account role smoke tests                                                              | Q5           | Owner      | AUD-006          | BLOCKED  |
| Q7  | P1       | Fix any RLS drift discovered in Q6                                                                     | Q6           | Code       | AUD-003          | BLOCKED  |
| Q8  | P1       | Open competition for submissions (phase25 DB rows + status=open)                                       | Q1           | Owner      | AUD-020          | BLOCKED  |
| Q9  | P1       | Add `typecheck` to CI workflow                                                                         | —            | Code       | AUD-018          | DONE     |
| Q10 | P1       | Add `release:check` or copy scans to CI                                                                | Q9           | Code       | AUD-019          | DONE     |
| Q11 | P1       | Require CI pass before Cloudflare deploy                                                               | Q9           | Code       | AUD-021          | DONE     |
| Q12 | P2       | Enforce evidence URL before claim verification                                                         | —            | Code       | AUD-032          | DONE     |
| Q13 | P2       | Admin pagination + retry on large lists                                                                | Q6           | Code       | —                | DONE     |
| Q14 | P2       | Role-specific integration tests with Supabase fixtures                                                 | Q1           | Code       | AUD-023          | BLOCKED  |
| Q15 | P2       | Complete experiment run/metric immutability model + UI                                                 | Q6           | Code       | AUD-008          | DEFERRED |
| Q16 | P2       | Startup validation/confidentiality schema + admin queue                                                | Q6           | Code       | AUD-009          | DEFERRED |
| Q17 | P2       | Independent reviewer assignment workflow                                                               | Q6           | Code       | AUD-010          | DONE     |
| Q18 | P3       | Playwright E2E suite (signup→onboard→apply→lead→contribute)                                            | Q6           | Code       | AUD-022          | DEFERRED |
| Q19 | P3       | Monitoring hooks + incident runbook                                                                    | Q5           | Code+Owner | AUD-031          | READY    |
| Q20 | P3       | Privacy-respecting analytics                                                                           | Q5           | Code       | AUD-017          | DONE     |
| Q21 | P3       | Project archive UX                                                                                     | Q6           | Code       | AUD-015          | DONE     |
| Q22 | P3       | Dataset registry tables                                                                                | Q15          | Code       | AUD-016          | DONE     |
| Q23 | P3       | Optional: public papers on `/publications`                                                             | Q6           | Code       | AUD-011          | DONE     |
| Q24 | P3       | Optional: DB-backed lab CMS                                                                            | Q6           | Code       | AUD-012          | DONE     |
| Q25 | P3       | Distributed rate limiting (KV/Redis)                                                                   | Abuse signal | Code       | AUD-029          | DEFERRED |

## Pass 2 scope (code — vertical slices)

Pass 2 code executes **after Phase 0 patch-up**:

| Priority | Task                                                    | Status   |
| -------- | ------------------------------------------------------- | -------- |
| P0       | Phase 0: `.env.example`, CI typecheck, memory reconcile | **Done** |
| P0       | phase26.sql migration                                   | **Done** |
| P0       | Slice 1: DB-backed labs + AdminLabsTab                  | **Done** |
| P0       | Slice 2: Public publications catalog                    | **Done** |
| P1       | Slice 3: Profile/onboarding enrichment                  | **Done** |
| P0       | Slice 4: Experiments/deliverables/datasets UI           | **Done** |
| P1       | Slice 5: Research paths DB + editorial workflow         | **Done** |
| P2       | Slice 6–7: Analytics adapter + unconfigured states      | **Done** |

## Pass 2 scope (owner — parallel, Q1–Q8)

Owner deployment runs in parallel; does **not** block Pass 2 code. Complete when Q5 and Q6 pass.

## Pass 3 scope (Q9–Q17)

CI parity, admin hardening, reviewer independence, integration tests.

## Pass 4 scope (Q18–Q25)

E2E, monitoring, analytics, archive UX, experiment/startup completion.

## Explicitly not queued (by design)

- Rewriting static institution content to DB (optional Q24 only)
- Finance4All / portfolio cross-project work
- Broad UI redesign
