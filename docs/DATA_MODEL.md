# Data Model

Pass 1 data model reference. Source of truth: `supabase/FINAL_SETUP.sql` + phases through `phase32.sql`.

## Overview

- **Database:** PostgreSQL via Supabase
- **Tables:** 46 (verified by `scripts/verify-supabase.mjs`)
- **Auth:** Supabase Auth; `profiles.id` FK → `auth.users`
- **Security:** Row Level Security on all user-facing tables; SECURITY DEFINER RPCs for privileged operations

## Entity groups

### Identity and roles

| Table                      | Purpose               | Key columns                                                        |
| -------------------------- | --------------------- | ------------------------------------------------------------------ |
| `profiles`                 | Member identity       | id, display_name, onboarding_completed, directory_visible, role    |
| `member_roles`             | Institutional roles   | user_id, role (administrator, project_lead, reviewer, lab_lead, …) |
| `member_preferences`       | UI/notification prefs | user_id, preferences JSON                                          |
| `notification_preferences` | Per-channel settings  | user_id, …                                                         |
| `skill_endorsements`       | Peer endorsements     | endorser_id, endorsed_id, skill                                    |

**Triggers:** `handle_new_user()` on signup; `protect_profile_role()` blocks client role escalation.

### Content (publishable)

| Table               | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `papers`            | Research paper records                             |
| `paper_analyses`    | Private member paper analyses (RLS: owner + admin) |
| `events`            | Institution events                                 |
| `newsletter_issues` | Newsletter archive                                 |
| `announcements`     | Institution announcements                          |
| `jobs`              | Open roles / opportunities                         |
| `programs`          | Fellowships, cohorts, workshops                    |
| `guides`            | Guide metadata (content may be bundled or DB)      |

**Publication:** `published` boolean; admin CRUD; public read via RLS for published rows.

### Projects and collaboration

| Table                        | Purpose                                |
| ---------------------------- | -------------------------------------- |
| `projects`                   | Project workspaces                     |
| `project_applications`       | Member applications to join            |
| `project_memberships`        | Accepted team members                  |
| `project_milestones`         | Milestone tracking                     |
| `project_contributions`      | Evidence submissions with verification |
| `project_updates`            | Lead updates to team                   |
| `project_follows`            | Member follows project                 |
| `project_experiments`        | Experiment specs (phase25)             |
| `project_deliverables`       | Deliverable artifacts (phase25)        |
| `lead_verification_requests` | Lead role verification                 |

**Lifecycle:** draft → published → recruiting → active → archived/closed

**Contribution integrity:** phase32 prohibits an author from reviewing their own contribution or being assigned as its reviewer, including when the author also holds lead/admin privileges.

### Programs and competitions

| Table                     | Purpose                           |
| ------------------------- | --------------------------------- |
| `program_applications`    | Program enrollment applications   |
| `competitions`            | Challenge catalog (phase25 seeds) |
| `competition_submissions` | User submissions                  |
| `labs`                    | Lab records (phase25)             |
| `lab_memberships`         | Lab affiliation                   |

### Member engagement

| Table                                          | Purpose               |
| ---------------------------------------------- | --------------------- |
| `notifications`                                | In-app notifications  |
| `saved_items`                                  | Bookmarked content    |
| `saved_collections` / `saved_collection_items` | Organized saves       |
| `reading_progress`                             | Paper reading state   |
| `paper_reads` / `paper_highlights`             | Reading analytics     |
| `reading_activity`                             | Activity heatmap data |
| `event_rsvps`                                  | Event attendance      |
| `newsletter_subscriptions`                     | Email list            |
| `job_applications`                             | Job apply tracking    |
| `member_feedback`                              | Product feedback      |
| `invitations`                                  | Member invitations    |

### Governance

| Table                  | Purpose                       |
| ---------------------- | ----------------------------- |
| `institutional_claims` | Public claims with evidence   |
| `content_reports`      | Moderation reports            |
| `admin_audit_log`      | Admin action audit            |
| `security_events`      | Security-sensitive events     |
| `partnerships`         | Partnership records (phase25) |

### Meta

| Table               | Purpose                |
| ------------------- | ---------------------- |
| `schema_migrations` | Applied phase tracking |

## Key RPCs (guarded)

| Function                        | Purpose                           |
| ------------------------------- | --------------------------------- |
| `review_project_application`    | Lead accepts/declines application |
| `review_project_contribution`   | Lead verifies contribution        |
| `set_project_membership_status` | Manage team membership            |
| `review_institutional_claim`    | Admin verifies public claim       |
| `notify_users`                  | Cross-user notification insert    |
| `search_portal_content`         | Full-text portal search           |
| `request_account_deletion`      | Account deletion request          |
| `is_platform_admin()`           | Unified admin check (phase25)     |

All RPCs: `REVOKE ALL FROM PUBLIC`; `GRANT EXECUTE TO authenticated` (or service role where appropriate).

## RLS patterns

1. **Owner scope:** `auth.uid() = user_id` for personal rows
2. **Project lead scope:** lead_id check via project join
3. **Published public read:** `published = true` for anon/authenticated SELECT
4. **Admin override:** `is_platform_admin()` for admin policies
5. **Member-only portal:** authenticated + onboarding_completed for member routes

Verification: `bun run supabase:rls` (requires DB credentials).

## Storage

- Avatar and file uploads via `src/lib/storage.ts`
- URL validation before use; magic-byte checks for images
- Bucket policies configured in Supabase dashboard (live verify required)

## Demo fallback (development only)

When Supabase env absent and not production, `src/lib/supabase-fallback.ts` serves seeds from `src/data/seed/*`. Production returns empty arrays.

## Missing tables (deferred)

- Experiment runs with immutable metrics
- Dataset versions
- Startup validation / confidentiality CRM
- Analytics events

See [AUDIT_MASTER.md](./AUDIT_MASTER.md) AUD-008, AUD-009, AUD-016.

## Migration apply order

1. `supabase/full-setup.sql` OR `supabase/FINAL_SETUP.sql` (consolidated through phase25)
2. If incremental: phases 19–25 via `bun run supabase:apply`
3. Verify: `supabase/VERIFY_SETUP.sql`
4. Optional seed: `supabase/seed-data.sql`
