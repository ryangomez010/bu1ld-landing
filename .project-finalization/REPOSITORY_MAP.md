# Repository map

## Runtime boundaries

- `src/routes/`: 60 route files covering public institution, auth, member, lead, reviewer, and admin surfaces.
- `src/components/`: shared UI, landing, institution, member workspace, and admin operations.
- `src/lib/`: domain logic, validation, Supabase adapters, API handlers, security, analytics, export, and tests.
- `src/server.ts`: Cloudflare/TanStack server entry; health, email, digest, deletion, SSR normalization, security headers.
- `api/`: Vercel-compatible function entry points.
- `supabase/`: base setup, incremental phases through phase32, verification SQL, seed content.
- `scripts/`: schema apply/verify, RLS checks, runtime env generation, route smoke, release gate, deployment.
- `public/`: robots, sitemap, social preview, manifest/static assets.
- `.github/workflows/`: CI and gated Cloudflare deployment.
- `docs/`: product, architecture, data model, owner actions, audit and continuity records.

## Data flow

Browser components call typed domain functions in `src/lib`. Supabase RLS protects direct reads/writes; privileged transitions use `SECURITY DEFINER` RPCs with explicit grants. Server handlers own service-role and email secrets. Public evidence is restricted to verified/public records.

## Core journeys

1. Public visitor: `/` → labs/programs/projects/evidence → signup/login.
2. Member: onboarding → dashboard → project application → accepted workspace.
3. Contributor: milestone → evidence submission → independent review → export/public record.
4. Lead/reviewer: applicant decision → milestone/reviewer assignment → verify/request changes.
5. Admin: leadership queues → publishing/governance → audit/security review.
