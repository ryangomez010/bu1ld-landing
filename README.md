# The Bu1ld — Member Platform

A machine learning institution membership hub: projects, guides, papers, events, jobs, and admin tooling.

## Stack

- TanStack Start + React 19
- Tailwind CSS v4 + shadcn UI
- Supabase (auth, Postgres) with seed + localStorage fallbacks

## Quick start

```bash
bun install
cp .env.example .env
bun run dev
```

Open `http://localhost:3000`

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | for live auth/data | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | for live auth/data | anon/public key |
| `VITE_EMAIL_ENDPOINT` | recommended for email | Server/edge URL that sends mail with a private Resend key |
| `VITE_RESEND_API_KEY` | local only | Do **not** use in production client builds |

## Supabase setup

Run SQL in order in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/phase2.sql`
3. `supabase/phase3.sql`
4. `supabase/phase4.sql`
5. `supabase/phase5.sql`
6. `supabase/phase6.sql` — admin role updates

Then set your profile `role` to `admin` in `profiles` for `/admin` access.

## Deploy

### Vercel

1. Import the repo and set framework to Vite / TanStack Start.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Prefer `VITE_EMAIL_ENDPOINT` pointing at a serverless function that holds `RESEND_API_KEY`.

### Cloudflare Workers

1. `wrangler.jsonc` worker name: `the-bu1ld-nexus`
2. Set secrets / vars for the same `VITE_*` keys used at build time.
3. Deploy with `bunx wrangler deploy` (after `bun run build`).

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Development server |
| `bun run build` | Production build |
| `bun run preview` | Preview production build |
| `bun run format` | Prettier format |
| `bun run lint` | ESLint |

## Member routes

| Route | Purpose |
|-------|---------|
| `/` | Public landing |
| `/signup`, `/login` | Auth |
| `/onboarding` | First-time profile |
| `/profile` | Edit profile |
| `/dashboard` | Member home |
| `/projects` | Browse & apply |
| `/applications` | Your applications |
| `/jobs` | Job board |
| `/events`, `/guides`, `/papers`, `/newsletter` | Content |
| `/search`, `/saved`, `/notifications` | Discovery & updates |
| `/admin` | Admin console (admin role) |
