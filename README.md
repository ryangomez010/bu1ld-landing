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

| Variable                 | Required              | Notes                                                     |
| ------------------------ | --------------------- | --------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | for live auth/data    | Supabase project URL                                      |
| `VITE_SUPABASE_ANON_KEY` | for live auth/data    | anon/public key                                           |
| `VITE_EMAIL_ENDPOINT`    | recommended for email | Server/edge URL that sends mail with a private Resend key |
| `VITE_RESEND_API_KEY`    | local only            | Do **not** use in production client builds                |

## Supabase setup

1. Paste `supabase/full-setup.sql` into the SQL editor (or `bun run supabase:apply` with `SUPABASE_DB_PASSWORD`).
   - Existing projects: run incremental `supabase/phase10.sql`, `phase11.sql`, then `phase12.sql` for RSVPs, paper sync, newsletter subscriptions, DB search, and admin audit log.
   - Seed/update content: `bun run supabase:seed` (needs `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_DB_PASSWORD`) or paste `supabase/seed-data.sql` in the SQL editor.
   - Apply a single phase: `bun run supabase:apply-phase -- phase12.sql`
2. Seed demo content: `bun run supabase:seed` (needs `SUPABASE_SERVICE_ROLE_KEY` or DB password), or paste `supabase/seed-data.sql`.
3. Verify: `bun run supabase:verify`
4. Sign up in the app, then promote your profile:

```sql
update public.profiles set role = 'admin' where id = '<your-user-uuid>';
```

## Scripts

| Command                   | Description                       |
| ------------------------- | --------------------------------- |
| `bun run dev`             | Development server                |
| `bun run build`           | Production build                  |
| `bun run preview`         | Preview production build          |
| `bun run format`          | Prettier format                   |
| `bun run lint`            | ESLint                            |
| `bun run test`            | Security utility unit tests       |
| `bun run supabase:verify` | Check tables + auth connectivity  |
| `bun run supabase:apply`  | Apply full schema via Postgres    |
| `bun run supabase:seed`   | Import seed content into Supabase |

## Email

Deploy `api/email.ts` on Vercel (or use `/api/email` on Cloudflare via `src/server.ts`).

| Server secret               | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `RESEND_API_KEY`            | Resend API key                                       |
| `EMAIL_API_SECRET`          | Bearer token clients send as `VITE_EMAIL_API_SECRET` |
| `SUPABASE_SERVICE_ROLE_KEY` | Resolve recipient email by `userId`                  |
| `EMAIL_FROM`                | Optional sender override                             |

Client: set `VITE_EMAIL_ENDPOINT` and matching `VITE_EMAIL_API_SECRET`.

## Deploy

### Vercel

1. Import the repo and set framework to Vite / TanStack Start.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Prefer `VITE_EMAIL_ENDPOINT` pointing at a serverless function that holds `RESEND_API_KEY`.

### Cloudflare Workers

1. `wrangler.jsonc` worker name must match the Cloudflare dashboard worker (`bu1ld-landing`).
2. Set secrets / vars for the same `VITE_*` keys used at build time.
3. Build then deploy: `bun run deploy:cf` (or `bun run build && npx wrangler versions upload` on Cloudflare CI).
4. `wrangler.jsonc` must point at `dist/server/server.js` — not `src/server.ts` — so Wrangler uses the Vite bundle.

## Member routes

| Route                                          | Purpose                    |
| ---------------------------------------------- | -------------------------- |
| `/`                                            | Public landing             |
| `/signup`, `/login`                            | Auth                       |
| `/onboarding`                                  | First-time profile         |
| `/profile`                                     | Edit profile               |
| `/dashboard`                                   | Member home                |
| `/projects`                                    | Browse & apply             |
| `/applications`                                | Your applications          |
| `/jobs`                                        | Job board                  |
| `/events`, `/guides`, `/papers`, `/newsletter` | Content                    |
| `/search`, `/saved`, `/notifications`          | Discovery & updates        |
| `/admin`                                       | Admin console (admin role) |
