# Architecture

Status: active-product architecture reference.

## Stack

- App: TanStack Start, React 19, TypeScript, TanStack Router, TanStack Query,
  Tailwind, Radix/shadcn UI primitives, Vite.
- Backend: Supabase Auth, Postgres, Row Level Security, Storage, and SQL RPCs.
- Runtime APIs: Vercel/Cloudflare-compatible handlers for email, digest, and
  account deletion.
- Tooling: Bun scripts, TypeScript, ESLint, Bun tests, Supabase verification
  scripts, release readiness script, Vercel and Cloudflare configs.

## Product Areas

- Public site: institutional positioning, public research/content, public
  evidence, legal pages, and conversion to membership.
- Member shell: dashboard, search, saved items, applications, notifications,
  profile, account settings, and learning/research work.
- Project workspaces: lead-created projects, applications, collaboration,
  contribution evidence, review, updates, and governed publication.
- Admin console: publishable content, members, claims, moderation, reports,
  audit/security, programmes, papers, projects, jobs, guides, events, and bulk
  operations.

## Data And Security Boundary

The browser handles interaction and optimistic state only. Supabase RLS, SQL
functions, and server/API handlers must enforce identity, ownership, roles,
publication state, application windows, evidence review, and destructive account
operations.

Local seed fallbacks are development-only. Production must use live Supabase
data and real empty states when records do not exist.

## Deployment Boundary

The same source can deploy through Vercel or Cloudflare, but production requires
one canonical deployment target, one canonical domain, one Supabase project, and
server-only secrets configured outside the client bundle.
