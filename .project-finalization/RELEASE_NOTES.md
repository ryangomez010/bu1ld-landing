# Release notes — Pass One finalization

Date: 2026-07-18

## Summary

The Bu1ld Nexus is now a local production release candidate for the institution/member platform. Contribution review integrity, leadership operations, privacy export completeness, and deployment configuration hygiene were closed in this pass. Live schema application, provider secrets, and role-separated production smoke remain owner actions.

## Major features and reworks

- Contribution self-review banned in SQL (`phase32`) and client authorization.
- Leadership overview now surfaces review backlog, overdue milestones, projects without leads, and stalled projects.
- Contribution evidence is exportable and included in the full account data export.
- Project-specific public backend values were removed from committed Wrangler configuration.
- Public/member/admin failure copy no longer exposes vendor setup instructions.
- Labs and competitions load with timeouts and catalog fallbacks.

## Security

- Independent contribution review enforced even for leads/admins.
- Self-reviewer assignment rejected at the database boundary.
- Release gate now checks phase32 invariants and expanded production-copy patterns.
- Deploy workflow requires release readiness and dependency audit before Worker deploy.

## Database

- Additive migration: `supabase/phase32.sql`
- Apply via `bun run supabase:apply` or `supabase/FINAL_SETUP.sql`
- Verify with `supabase/VERIFY_SETUP.sql`, `bun run supabase:verify`, and `bun run supabase:rls`

## Verification evidence

- `bun run release:check` PASS
- `bun run audit:ci` PASS (no high/critical findings reported)
- `bun run smoke` PASS (22 critical paths)
- Local HTTP smoke: `/`, `/labs`, `/programs-public`, `/projects`, `/evidence`, `/login`, `/signup`, `/privacy`, `/account/security`, `/admin` all returned 200 without fatal SSR bodies
- Protected routes did not leak admin/export content when unauthenticated

## Breaking changes

None for existing clients. Existing contribution records remain valid. Deploy environments must supply `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` because Wrangler no longer embeds them.

## Remaining external blockers

See `EXTERNAL_BLOCKERS.md`.
