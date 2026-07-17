# Project status

**Date:** 2026-07-16  
**Branch:** `main` (local WIP may include uncommitted institution expansion)

## What works

- Public institution IA: labs (6), programs, competitions, people, partnerships, publications, apply flow
- Member portal: projects, applications, programs, research, events, jobs, directory, invitations UI
- Admin console: members (expanded institutional roles), content, moderation, evidence
- Schema through phase23 (+ phase24 SQL ready for labs/competitions/partnerships/invitations)
- Cloudflare deploy pipeline + runtime-env injection for Supabase keys
- Role helpers unify legacy admin and institutional administrator in UI

## Journey coverage

| Step | Status |
|------|--------|
| Discover institution | Public pages live |
| Apply | `/apply` → signup → onboarding |
| Accepted to project/program | RPC + manage queues |
| Join team | Memberships + `/invitations` |
| Submit work | Contributions / milestones |
| Receive feedback | Lead verification + notifications |

## Remaining gaps

1. **Apply `phase24.sql` on live Supabase** and seed published labs/competitions.
2. **CLOUDFLARE_API_TOKEN** in GitHub for automated deploys.
3. **RLS**: most admin policies still require `profiles.role = 'admin'`; institutional `administrator` alone is not enough for DB writes — promote legacy admin for operators.
4. **Invitation accept** does not yet auto-insert `project_memberships` (status update only) — follow-up RPC recommended.
5. **Competition submission UI** for members (table + RLS exist; portal form thin).
6. **Guides CMS** still file-based.
7. **E2E role smoke tests** against live project not automated in CI.

## Quality gates

```bash
bun run typecheck && bun run lint && bun test && bun run build
```

Credential blockers are documented in `DEPLOYMENT.md` and `REMAINING_EXTERNAL_ACTIONS.md` when present.
