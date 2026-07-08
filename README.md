# The Bu1ld — Member Platform

A machine learning institution membership hub: projects, guides, papers, events, jobs, and admin tooling.

## Stack

- TanStack Start + React 19
- Tailwind CSS v4 + shadcn UI
- Supabase (auth, Postgres) with seed + localStorage fallbacks

## Quick start

```bash
bun install
bun run dev
```

Open `http://localhost:3000`

## Supabase setup (optional at first)

Run SQL in order in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/phase2.sql`
3. `supabase/phase3.sql`
4. `supabase/phase4.sql`
5. `supabase/phase5.sql`

Copy `.env.example` → `.env` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Set your profile `role` to `admin` in the `profiles` table for `/admin` access.

Optional email: `VITE_RESEND_API_KEY`

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

## Deploy

Works on Vercel or Cloudflare (see `vercel.json` / `wrangler.jsonc`).
