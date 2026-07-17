# Master Audit

## Verdict

Closed beta ready after live deployment configuration and role smoke testing. Not production ready until strict live checks pass and the externally blocked items below are completed.

## Evidence summary

| Area                               | Status                                 | Severity       | Evidence                                                                         | Launch impact                                       | Acceptance criteria                                            |
| ---------------------------------- | -------------------------------------- | -------------- | -------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| Local typecheck/test/lint/build    | Verified complete                      | Low            | `bun run release:check` passes                                                   | Supports release candidate confidence               | Gate passes on clean checkout                                  |
| Strict production gate             | Externally blocked                     | Launch blocker | `bun run release:prod` blocks missing live DB/secrets                            | Prevents false production-ready claim               | Passes in deployment environment                               |
| Public auth copy                   | Verified complete                      | Low            | Runtime source scan blocks setup wording                                         | Prevents developer leakage to users                 | No setup hints in UI                                           |
| Seed content claims                | Verified complete                      | Medium         | Content integrity test blocks unsupported affiliation/customer/benchmark phrases | Prevents fake institutional claims                  | Seed/app content stays evidence-conservative                   |
| Public website                     | Functional                             | Medium         | Landing/public routes build and browser smoke passed                             | Visitor can understand product                      | Full browser QA before launch                                  |
| Member onboarding/profile          | Functional                             | Medium         | Routes, validation, profile write boundary, onboarding flows exist               | Member identity and matching work                   | Manual signup/onboarding smoke test                            |
| Project applications               | Functional                             | High           | `project_applications`, guarded review RPC, UI routes                            | Core member-to-team journey                         | Lead accepts/declines with separate account                    |
| Project memberships                | Functional                             | High           | `project_memberships`, status RPC, RLS                                           | Team membership survives application status changes | Accepted member joins; removed user loses access               |
| Milestones/contributions           | Functional                             | High           | `project_milestones`, `project_contributions`, verification RPC                  | Enables output tracking                             | Member submits; lead verifies or requests revision             |
| Reviewer/mentor workflow           | Partial                                | Medium         | Roles exist; review path mostly project lead/admin                               | Reviewer role is not fully independent              | Assigned reviewer can review only assigned work                |
| Research experiment tracking       | Missing as first-class model           | High           | No dedicated experiment/run/artifact schema                                      | Limits serious ML reproducibility operations        | Add immutable experiment/run/result/artifact tables            |
| Startup confidentiality/validation | Partial                                | High           | Startup project type exists; no first-class confidential startup CRM             | Limits sensitive startup handling                   | Add startup validation/evidence/confidentiality schema         |
| Institutional claims               | Functional                             | High           | `institutional_claims`, evidence URL, review RPC, evidence route                 | Blocks unsupported public claims                    | Verified claims require source and admin review                |
| Admin console                      | Functional                             | High           | Admin tabs, member/content/claim/moderation/security surfaces                    | Operational control exists                          | Live admin smoke with separate account                         |
| RLS/security                       | Functional but needs live verification | Launch blocker | RLS scripts and policies exist; strict gate requires live checks                 | Cannot prove production privacy locally             | `bun run supabase:verify` and `bun run supabase:rls` pass live |
| Email/digest/account deletion      | Functional but externally blocked      | High           | Handler tests pass; secrets missing locally                                      | Notifications/digest/deletion need deployed runtime | Deployed endpoints tested with real sessions                   |
| Mobile/accessibility               | Functional but not exhaustive          | Medium         | Browser smoke passed core routes; accessible loading states added                | Needs full device matrix                            | Run E2E/mobile QA for all critical paths                       |
| Documentation                      | Verified complete for current scope    | Low            | Product, architecture, security, system map, release docs added                  | Operator can understand launch state                | Keep docs updated per release                                  |

## Root causes remediated

- Developer/setup copy leaked into user-facing auth/admin states.
- Seed content contained legacy brand names and unsupported affiliation/customer/benchmark-style claims.
- Release gate did not scan seed SQL for public claim-risk phrases.
- Evidence/loading states and docs did not fully reflect the true launch boundary.

## Remaining launch blockers

1. Live Supabase database URL/password or password-derived connection.
2. Server-only service-role key in deployment runtime.
3. Resend API key, digest secret, and deployed email endpoint.
4. Supabase site URL, redirect URLs, OAuth providers, and storage policies configured in dashboard.
5. Live RLS/schema verification.
6. Separate-account smoke tests for member, lead, reviewer/mentor, moderator/admin, and removed user.

## Intentionally deferred

- First-class immutable experiment/run/metric/artifact tables.
- Confidential startup CRM fields for interviews, pilots, customers, revenue, funding, and verification states.
- Department-level ownership model beyond current roles/programs/projects.
- Full Playwright E2E suite for every acceptance journey.

## Thirty-day roadmap

1. Week 1: deploy staging with live Supabase, run strict gate, run separate-role smoke tests, fix RLS drift.
2. Week 2: add experiment/run/artifact schema with immutable verified metric policy and UI surfaces.
3. Week 3: add startup validation/confidentiality schema and admin review queue.
4. Week 4: add Playwright journey suite, monitoring dashboards, and production incident runbook.
