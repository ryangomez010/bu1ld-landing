# Database

Postgres lives in Supabase. Schema is applied via ordered SQL phases; `supabase/FINAL_SETUP.sql` consolidates through phase23. **Phase 24** adds labs, competitions, partnerships, and invitations.

## Apply order

1. Prefer `supabase/FINAL_SETUP.sql` on a fresh project (through paper analyses).
2. Then `supabase/phase24.sql` for labs / competitions / partnerships / invitations.
3. Verify with `supabase/VERIFY_SETUP.sql` or `bun run supabase:verify`.
4. Seed optional demo rows: `supabase/seed-data.sql` or `bun run supabase:seed` (needs service role).

## Core tables

| Domain | Tables |
|--------|--------|
| Identity | `profiles`, `member_roles`, `member_preferences` |
| Labs | `labs`, `lab_memberships` |
| Projects | `projects`, `project_applications`, `project_memberships`, `project_milestones`, `project_contributions`, `project_updates`, `project_follows` |
| Programs | `programs`, `program_applications` |
| Competitions | `competitions`, `competition_submissions` |
| Partnerships | `partnerships` |
| Invitations | `invitations` |
| Research content | `papers`, `paper_analyses`, `paper_reads`, `paper_highlights`, `reading_progress` |
| Ops | `events`, `event_rsvps`, `jobs`, `job_applications`, `announcements`, `notifications` |
| Governance | `institutional_claims`, `admin_audit_log`, `security_events`, `content_reports` |

## RLS principles

- Published public catalogs (`labs`, `competitions`, `partnerships`, papers/events when `published`) are readable without auth when policies allow.
- Mutations require `auth.uid()` ownership, project/lab lead, or `profiles.role = 'admin'`.
- Capacity-limited acceptance goes through RPCs (`review_project_application`) so clients cannot bypass checks.
- Profile `role` changes are protected by triggers (`protect_profile_role`).

## Phase 24 notes

- `projects.lab_id` optional FK to `labs`.
- `programs.program_type` includes `incubation` and `competition`.
- `member_roles.role` includes `lab_lead`, `startup_founder`, `applicant`.
- Invitation tokens use `pgcrypto` (`gen_random_bytes`).

## Indexes

Phases create indexes on foreign keys, published flags, and status columns used by list/filter queries. Prefer `EXPLAIN` on new hot paths before adding more.
