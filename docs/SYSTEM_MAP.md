# The Bu1ld System Map

This map reflects repository evidence as of the current launch-hardening pass.

## Architecture layers

| Layer             | Implementation                                                                                                              | Evidence                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Public website    | Landing sections, public research/papers/projects/programs/events/jobs/guides/newsletter/evidence routes                    | `src/routes/index.tsx`, public route files, landing components                                            |
| Member portal     | Dashboard, onboarding, profile, saved collections, applications, notifications, account settings                            | `src/routes/dashboard.tsx`, `src/routes/onboarding.tsx`, `src/routes/profile.tsx`, `src/routes/account/*` |
| Project engine    | `projects`, `project_applications`, `project_memberships`, `project_milestones`, `project_contributions`, `project_updates` | `supabase/phase3.sql`, `phase19.sql`, `phase20.sql`, `phase22.sql`, `src/lib/project-collaboration.ts`    |
| Research library  | Papers, reviews, explainers, notes, reading progress, highlights, saved collections, private paper analyses                 | `src/routes/papers/*`, `src/routes/research/analyze.tsx`, `src/components/member/PaperReader.tsx`         |
| Programs          | Cohorts, fellowships, workshops, application windows, applications                                                          | `src/routes/programs/*`, `src/lib/programs.ts`, `supabase/phase19.sql`, `phase22.sql`                     |
| Admin console     | Members, publishing, projects, programs, claims, moderation, jobs, papers, events, audit/security overview                  | `src/routes/admin/index.tsx`, `src/components/admin/*`                                                    |
| Security boundary | Supabase Auth, RLS, guarded RPCs, safe URL/text handling, email/digest/account-deletion handlers                            | `src/lib/auth.tsx`, `src/lib/security.ts`, `scripts/verify-rls.mjs`, `supabase/phase*.sql`                |
| Release gates     | Typecheck, tests, lint, production build, copy/security scan, strict live Supabase checks                                   | `scripts/release-readiness.mjs`, `package.json`                                                           |

## Entity relationships

```text
profile
  ├─ member_roles
  ├─ member_preferences
  ├─ saved_collections ─ saved_collection_items
  ├─ paper_analyses
  ├─ notifications
  ├─ project_applications ─ project
  ├─ program_applications ─ program
  ├─ project_memberships ─ project
  ├─ project_contributions ─ project_milestone ─ project
  ├─ project_updates
  ├─ content_reports
  ├─ member_feedback
  └─ security_events

project
  ├─ project_applications
  ├─ project_memberships
  ├─ project_milestones
  ├─ project_contributions
  ├─ project_updates
  └─ project_update_subscribers

paper / guide / event / job / newsletter / program
  ├─ public route
  ├─ saved collection references
  ├─ admin publication controls
  └─ content reports where applicable

institutional_claim
  ├─ evidence_url
  ├─ evidence_label
  ├─ review status
  └─ public evidence register when verified
```

## Role map

| Role            | Supported state                                   | Capabilities                                                                  | Source of truth                                                  |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Visitor         | Verified complete for public routes               | Reads published content, evidence register, auth entry points                 | Public routes and RLS published policies                         |
| Applicant       | Verified complete for basic project/program flows | Signs up, onboards, submits applications                                      | Auth, onboarding, application routes                             |
| New member      | Functional                                        | Completes profile, saves items, receives dashboard recommendations            | Profiles, preferences, saved collections                         |
| Active member   | Functional                                        | Applies, joins accepted projects, records contributions, tracks notifications | Project memberships/contributions/notifications                  |
| Project lead    | Functional                                        | Reviews applications, manages members, milestones, contributions, updates     | Lead checks, `review_project_application`, project manage routes |
| Reviewer/mentor | Partial                                           | Institutional role exists; contribution review is lead/admin-centric          | `member_roles`, contribution UI/RPCs                             |
| Moderator       | Functional through admin                          | Reviews content reports and feedback                                          | Admin moderation tab                                             |
| Administrator   | Functional, externally verified after live DB     | Publishes content, manages members/roles/claims/security                      | Admin route, RLS, RPCs                                           |
| Operator        | Externally blocked                                | Configures Supabase, secrets, email, cron, deployment                         | README, release checklist, `release:prod`                        |

## Lifecycle map

### Member lifecycle

Visitor → signup/login → onboarding → profile completeness → dashboard → discovery → application → review → membership → contribution → review → verified contribution → alumni/leadership.

### Project lifecycle

Draft/submitted → changes requested or published → open recruitment → active team → milestones → contributions/deliverables → review → archived/closed.

### Research lifecycle currently supported

The platform supports paper records, reviews/explainers, project briefs, milestones, contribution evidence, verification notes, and public claims. It does not yet model first-class experiment runs with immutable metrics, seeds, dataset versions, checkpoints, artifacts, and reproducibility status as separate database tables.

### Startup lifecycle currently supported

Startup projects are supported through the universal project engine: project type, applications, team membership, updates, milestones, contribution evidence, links, and admin publication. Confidential startup fields, pilots, revenue, funding, customer interviews, and verification states are not yet first-class tables.

## Launch interpretation

The current product can operate as a closed-beta research/building institution if live Supabase, email, and role smoke tests pass. It is not yet a complete laboratory information system for immutable experiment metrics or a full startup CRM.
