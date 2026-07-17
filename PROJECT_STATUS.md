# Project status

**Date:** 2026-07-17  
**Branch:** `main`

## What works

- Public institution IA: 6 labs, programs, competitions (detail + submit), people, partnerships, publications, apply flow
- Member portal: projects, applications, programs, research, events, jobs, directory, invitations (accept → membership via RPC)
- Project lead invite-by-email on manage page
- Admin console: members, content, moderation, evidence, **institutions** (competition review)
- Schema through **phase25** (`is_platform_admin`, lab/competition seeds, experiments, deliverables)
- Cloudflare deploy pipeline + runtime-env injection for Supabase keys
- Role helpers unify legacy admin and institutional administrator in UI; DB helper `is_platform_admin()` for RLS

## Journey coverage

| Step                        | Status                                              |
| --------------------------- | --------------------------------------------------- |
| Discover institution        | Public pages live                                   |
| Apply                       | `/apply` → signup → onboarding                      |
| Accepted to project/program | RPC + manage queues                                 |
| Join team                   | Memberships + `/invitations` + `accept_invitation`  |
| Submit work                 | Contributions / milestones / competition submissions |
| Receive feedback            | Lead verification + admin competition review        |

## Remaining external blockers

1. **Apply `phase25.sql` (or re-run FINAL_SETUP / VERIFY_SETUP) on live Supabase** so labs/competitions seed and `is_platform_admin` exist.
2. **CLOUDFLARE_API_TOKEN** (+ account id) in GitHub for automated deploys.
3. Set competition `status = 'open'` in SQL when a challenge is ready for entries.
4. Optional: promote operators with `profiles.role = 'admin'` **or** `member_roles.role = 'administrator'`.

## Quality gates

```bash
bun run typecheck && bun run lint && bun test && bun run build
```

Credential blockers: `DEPLOYMENT.md`, `REMAINING_EXTERNAL_ACTIONS.md`.
