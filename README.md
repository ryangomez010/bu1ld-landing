# The Bu1ld — Member Platform

An independent machine-learning research and building platform: projects, guides, papers, events, programs, and administration.

## Stack

- TanStack Start + React 19
- Tailwind CSS v4 + shadcn UI
- Supabase (auth, Postgres) with seed fallbacks for local demo mode only

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

1. Run `bun run supabase:apply` with `SUPABASE_DB_PASSWORD`, or paste `supabase/full-setup.sql`, then `supabase/phase19.sql`, `phase20.sql`, `phase21.sql`, `phase22.sql`, and `phase23.sql` into the SQL editor in that order.
   - Existing projects: apply every missing incremental phase through `phase23.sql`. Phases 19–23 add programmes, project memberships, contribution evidence and review, governed project publication, institutional roles, application windows, the public evidence register, and private saved paper analyses.
   - Seed/update content: `bun run supabase:seed` (needs `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_DB_PASSWORD`) or paste `supabase/seed-data.sql` in the SQL editor.
   - Apply a single phase: `bun run supabase:apply-phase -- phase12.sql`
2. Seed demo content: `bun run supabase:seed` (needs `SUPABASE_SERVICE_ROLE_KEY` or DB password), or paste `supabase/seed-data.sql`.
3. Verify: `bun run supabase:verify`
4. Sign up in the app, then promote your profile:

```sql
update public.profiles set role = 'admin' where id = '<your-user-uuid>';
```

## Scripts

| Command                   | Description                                                   |
| ------------------------- | ------------------------------------------------------------- |
| `bun run dev`             | Development server                                            |
| `bun run build`           | Production build                                              |
| `bun run preview`         | Preview production build                                      |
| `bun run format`          | Prettier format                                               |
| `bun run lint`            | ESLint                                                        |
| `bun run test`            | Security utility unit tests                                   |
| `bun run supabase:verify` | Check tables + auth connectivity                              |
| `bun run supabase:apply`  | Apply full schema via Postgres                                |
| `bun run supabase:seed`   | Import seed content into Supabase                             |
| `bun run release:check`   | Types, tests, lint, production build, and copy/security gates |
| `bun run release:prod`    | Strict production gate with live Supabase schema/RLS checks   |

## Email

Deploy `api/email.ts` on Vercel (or use `/api/email` on Cloudflare via `src/server.ts`).

| Server secret               | Purpose                                            |
| --------------------------- | -------------------------------------------------- |
| `RESEND_API_KEY`            | Resend API key                                     |
| `EMAIL_API_SECRET`          | Optional server-only secret for trusted automation |
| `SUPABASE_SERVICE_ROLE_KEY` | Resolve recipient email by `userId`                |
| `EMAIL_FROM`                | Optional sender override                           |

Client: set `VITE_EMAIL_ENDPOINT`. In production, the client sends the signed-in Supabase session;
do not expose any email or automation secret through a `VITE_` variable.

## Digest emails

Deploy `api/digest.ts` and schedule a daily cron (e.g. `0 8 * * *` UTC via Vercel Cron).

| Server secret               | Purpose                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| `DIGEST_API_SECRET`         | Bearer token for `POST /api/digest` (or reuse `EMAIL_API_SECRET`) |
| `RESEND_API_KEY`            | Sends digest emails via Resend                                    |
| `SUPABASE_SERVICE_ROLE_KEY` | Loads member preferences and content for ranking                  |

Apply `supabase/phase17.sql` to add `last_digest_sent_at` tracking on `member_preferences`.

Test a dry run:

```bash
curl -X POST https://your-app.vercel.app/api/digest \
  -H "Authorization: Bearer $DIGEST_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true,"frequency":"daily"}'
```

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

| Route                                          | Purpose                         |
| ---------------------------------------------- | ------------------------------- |
| `/`                                            | Public landing                  |
| `/signup`, `/login`                            | Auth                            |
| `/onboarding`                                  | First-time profile              |
| `/profile`                                     | Edit profile                    |
| `/dashboard`                                   | Member home                     |
| `/projects`                                    | Browse, apply, contribute       |
| `/programs`                                    | Cohorts, fellowships, workshops |
| `/applications`                                | Your applications               |
| `/jobs`                                        | Job board                       |
| `/events`, `/guides`, `/papers`, `/newsletter` | Content                         |
| `/search`, `/saved`, `/notifications`          | Discovery & updates             |
| `/admin`                                       | Admin console (admin role)      |
| `/evidence`                                    | Public verified-claims register |

## Production Release Gate

Before release, the deployment environment must contain the live database connection and server-only
secrets. Run:

```bash
bun run release:prod
```

That strict gate runs type checks, tests, lint, the production build, live table verification, and
RLS verification. It must pass after applying all schema phases through `phase23.sql`, configuring
Supabase site URL and redirect URLs, setting provider secrets, configuring the daily digest cron, and
verifying the email sender domain. Then run final smoke tests with separate visitor, member,
project lead, reviewer, and administrator accounts.
