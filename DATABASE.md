# Database

Postgres lives in Supabase. Schema is applied via ordered SQL phases; `supabase/FINAL_SETUP.sql` consolidates through **phase25**.

## Apply order

1. Prefer `supabase/FINAL_SETUP.sql` on a fresh project (through phase25).
2. On an existing project already at phase24, apply `supabase/phase25.sql` alone.
3. Verify with `supabase/VERIFY_SETUP.sql` or `bun run supabase:verify`.
4. Seed optional demo content rows: `supabase/seed-data.sql` or `bun run supabase:seed` (needs service role). Phase25 already seeds published labs, competitions, and partnerships.

## Core tables

| Domain           | Tables                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity         | `profiles`, `member_roles`, `member_preferences`                                                                                               |
| Labs             | `labs`, `lab_memberships`                                                                                                                      |
| Projects         | `projects`, `project_applications`, `project_memberships`, `project_milestones`, `project_contributions`, `project_updates`, `project_follows` |
| Experiments      | `project_experiments`, `project_deliverables`                                                                                                  |
| Programs         | `programs`, `program_applications`                                                                                                             |
| Competitions     | `competitions`, `competition_submissions`                                                                                                      |
| Partnerships     | `partnerships`                                                                                                                                 |
| Invitations      | `invitations`                                                                                                                                  |
| Research content | `papers`, `paper_analyses`, `paper_reads`, `paper_highlights`, `reading_progress`                                                              |
| Ops              | `events`, `event_rsvps`, `jobs`, `job_applications`, `announcements`, `notifications`                                                          |
| Governance       | `institutional_claims`, `admin_audit_log`, `security_events`, `content_reports`                                                                |

## RLS principles

- Published public catalogs (`labs`, `competitions`, `partnerships`, papers/events when `published`) are readable without auth when policies allow.
- Mutations require `auth.uid()` ownership, project/lab lead, or **`is_platform_admin()`** (legacy `profiles.role = 'admin'` **or** `member_roles.administrator`).
- Capacity-limited acceptance goes through RPCs (`review_project_application`, `accept_invitation`) so clients cannot bypass checks.
- Profile `role` changes are protected by triggers (`protect_profile_role`).

## Phase 24–25 notes

- `projects.lab_id` optional FK to `labs`.
- `programs.program_type` includes `incubation` and `competition`.
- `member_roles.role` includes `lab_lead`, `startup_founder`, `applicant`.
- Invitation tokens use `pgcrypto` (`gen_random_bytes`).
- `accept_invitation` creates/reactivates `project_memberships` or `lab_memberships`.
- Phase25 seeds six labs + two competitions + partnership disclosures.

## Related

- `SECURITY.md` — threat model and storage rules
- `DATABASE_SETUP.md` — operator checklist
- `docs/SYSTEM_MAP.md` — entity relationships
