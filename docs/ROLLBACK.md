# Rollback

Updated: 2026-07-19

## Rollback principles

- Prefer reversible changes and documented migration paths.
- Never drop user content, project evidence, applications, reviews, or contribution records without a verified backup and explicit approval.
- Treat role/RLS migrations as release-critical; rehearse rollback on staging before production.

## Application rollback

1. Identify the last known good deployment artifact.
2. Re-deploy the last known good build.
3. Verify public pages, authentication, member dashboard, project pages, applications, admin screens, and evidence pages.
4. Review logs for failed requests after rollback.

## Database rollback

1. Stop writes if the migration can corrupt or expose data.
2. Backup affected tables.
3. Apply a forward-fix migration when possible.
4. If reverting is required, verify RLS and constraints immediately after.
5. Rerun `bun run supabase:verify` and `bun run supabase:rls`.

## Communication

Record:

- incident time;
- affected feature;
- user impact;
- rollback command or deployment artifact;
- database migration IDs;
- verification commands and results;
- follow-up prevention task.
