# Acceptance Criteria

Frozen acceptance criteria for The Bu1ld Nexus. Pass 1 defines; Pass 2+ validates.

## Pass 1 completion criteria

- [x] All 15 memory files exist and cross-reference correctly
- [x] `PROJECT_MEMORY.md` is canonical and current
- [x] `AUDIT_MASTER.md` contains ≥30 issues with stable IDs
- [x] Baseline commands recorded in `LAST_KNOWN_GOOD_STATE.md`
- [x] `IMPLEMENTATION_QUEUE.md` dependency-ordered and frozen
- [x] `OWNER_ACTIONS.md` lists only credentialed steps
- [x] Low-risk doc/env fixes applied
- [x] `release:check` re-validated after edits

## Platform acceptance by domain

### Public site

| Criterion                                    | Validation                               |
| -------------------------------------------- | ---------------------------------------- |
| Landing loads without errors                 | Build + browser smoke                    |
| All public routes reachable                  | Route manifest / manual crawl            |
| No setup language in UI                      | `production-copy.test.ts` + release scan |
| Evidence register shows only verified claims | RLS + admin review flow                  |
| Legal pages accessible                       | `/terms`, `/privacy`                     |

### Authentication

| Criterion                                        | Validation                |
| ------------------------------------------------ | ------------------------- |
| Email signup/login works                         | Live smoke                |
| OAuth (GitHub/Google) works                      | Live smoke on prod domain |
| Password reset completes                         | Email + `/reset-password` |
| Unauthenticated users blocked from member routes | auth-guards tests + live  |
| Incomplete onboarding redirected                 | auth-guards tests + live  |

### Member portal

| Criterion                              | Validation             |
| -------------------------------------- | ---------------------- |
| Onboarding completes and persists      | Live smoke             |
| Profile updates save to Supabase       | Live smoke             |
| Directory respects visibility settings | members.ts + live      |
| Search returns results                 | RPC or client fallback |
| Notifications deliver on key events    | Live cross-user test   |
| Saved collections persist              | Live smoke             |

### Projects and applications

| Criterion                                        | Validation        |
| ------------------------------------------------ | ----------------- |
| Member can apply to published project            | Live smoke        |
| Lead can accept/decline application              | Separate accounts |
| Accepted member joins project_memberships        | RPC + live        |
| Member can submit contribution with evidence URL | Live smoke        |
| Lead can verify/request revision                 | Live smoke        |
| Removed member loses access                      | Live smoke        |

### Research

| Criterion                             | Validation        |
| ------------------------------------- | ----------------- |
| Paper library loads published papers  | Live / demo seeds |
| Paper analyzer saves private analysis | Live RLS test     |
| Member cannot read another's analysis | Live RLS test     |
| Reading progress persists             | Live smoke        |

### Programs and competitions

| Criterion                                  | Validation        |
| ------------------------------------------ | ----------------- |
| Member can apply to open program           | Live smoke        |
| Competition submission works on DB catalog | Post-phase25 live |
| Seed-only competitions show clear error    | Unit + live       |

### Admin

| Criterion                            | Validation |
| ------------------------------------ | ---------- |
| Non-admin denied `/admin`            | Live smoke |
| Admin can publish content            | Live smoke |
| Admin can review institutional claim | Live smoke |
| Moderation tab processes reports     | Live smoke |
| Audit log records sensitive actions  | Live smoke |

### Security

| Criterion                                 | Validation                |
| ----------------------------------------- | ------------------------- |
| `release:prod` passes                     | Strict gate               |
| `supabase:verify` + `supabase:rls` pass   | Live                      |
| No secrets in client bundle               | release gate + grep       |
| Seed content passes integrity scan        | content-integrity.test.ts |
| API handlers reject unauthorized requests | handler tests + live      |

### CI/CD

| Criterion                      | Validation        |
| ------------------------------ | ----------------- |
| CI runs lint, test, build      | GitHub Actions    |
| Typecheck in CI                | After AUD-018 fix |
| Deploy blocked on test failure | After AUD-021 fix |

### Mobile and accessibility

| Criterion                             | Validation       |
| ------------------------------------- | ---------------- |
| Core routes usable on mobile viewport | Manual device QA |
| Loading states have accessible labels | Spot-check       |
| Keyboard navigation on key forms      | Manual QA        |

## Closed-beta launch gate

All of the following must pass:

1. `bun run release:prod` on staging/production environment
2. `supabase:verify` and `supabase:rls` on target project
3. Role smoke tests (member, lead, admin, removed user) documented green
4. Email send + digest dry-run + account deletion tested
5. OAuth on production domain
6. No BLOCKED items in AUDIT_MASTER except explicitly deferred (AUD-008, AUD-009, AUD-022, AUD-023)

## Production launch gate (future)

Adds:

- Experiment reproducibility model (AUD-008 complete)
- Startup CRM or explicit scope reduction (AUD-009)
- E2E suite green (AUD-022)
- Monitoring/runbook (AUD-031)
