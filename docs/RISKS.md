# Risks

Updated: 2026-07-19

## Release risks

- Dirty worktree must be reviewed and committed before treating the branch as the release artifact.
- Live Supabase schema (through phase33), RLS, and role journeys are unverified from this machine pass.
- Public catalog can honestly be empty until leads publish recruiting briefs — empty states are intentional.
- Email, OAuth, password reset, digest, and account deletion still depend on deployed handlers and dashboard config.
- Analytics remains a no-op until `VITE_ANALYTICS_DOMAIN` is set.

## Mitigations already in source

- Project-first public CTAs reduce dead “join” paths that skip the brief.
- Anon project detail no longer selects private workspace/discord columns.
- Robots/sitemap and `privatePageHead` keep auth/member surfaces out of search indexes.
- Application submit uses atomic `submit_project_application` RPC (phase33) with capacity/status checks.

## Scientific / claims risks

- Research threads and lab copy must not be presented as completed external validation.
- Seed/catalog preview competitions must remain labeled as such until live open rows exist.

