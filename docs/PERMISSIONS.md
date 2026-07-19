# Permissions

Updated: 2026-07-19

## Role model

- Visitor: can read public pages and public evidence only.
- Applicant: can submit applications and authentication flows.
- Member: can manage own profile, save papers/projects, request project contribution, and submit own work where accepted.
- Reviewer: can review assigned submissions and cannot self-review.
- Project lead: can manage assigned projects, review contributor requests, assign milestones, and validate project evidence.
- Lab lead: can coordinate lab-specific projects and programs where assigned.
- Administrator: can manage public content, applications, roles, moderation, evidence verification, and release-sensitive administration.

## Enforcement expectations

- Client checks are UI affordances only.
- Server/API handlers must validate session and role.
- Supabase RLS must deny unauthorized direct reads/writes.
- Private applications, unpublished reviews, private contributions, and admin functions must never rely on route hiding alone.
- Cross-user notification writes must use controlled RPC/server flows.
- Contribution self-review is forbidden even for privileged users.

## Verification expectations

- Unit tests for role helpers and self-review denial.
- RLS verification scripts for live Supabase state.
- Manual role smoke tests before production release.
- Audit log review for sensitive admin actions.
