# Deployment

## Cloudflare Workers

Worker name: `bu1ld-landing` (`wrangler.jsonc`).

```bash
# Local auth once
npx wrangler login

# Build (writes runtime-env.js + Vite bundle) and deploy
bun run deploy:cf
```

Or push to `main` to run `.github/workflows/deploy-cloudflare.yml` (requires secrets below).

## Required secrets / vars

### Build / client

| Name | Where |
|------|--------|
| `VITE_SUPABASE_URL` | `.env`, CI secrets, or `wrangler.jsonc` `vars` |
| `VITE_SUPABASE_ANON_KEY` | same |

`scripts/generate-runtime-env.mjs` falls back to `wrangler.jsonc` vars when CI secrets are empty.

### GitHub Actions deploy

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Workers deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Account scope |

### Optional production services

| Name | Purpose |
|------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Seed scripts, admin email user resolve, account deletion |
| `RESEND_API_KEY` / `EMAIL_API_SECRET` | Transactional email |
| `DIGEST_API_SECRET` | Cron digest endpoint |
| `VITE_EMAIL_ENDPOINT` | Client → `/api/email` |

## Supabase dashboard checklist

1. Apply `FINAL_SETUP.sql` then `phase24.sql`.
2. Auth → URL config: Site URL `https://thebu1ld.com`; redirects for `/auth/callback`, `/reset-password`.
3. Enable email provider; optionally GitHub/Google OAuth.
4. Promote first admin: `update public.profiles set role = 'admin' where id = '<uuid>';`

## Verify

```bash
bun run typecheck
bun run lint
bun test
bun run build
bun run supabase:verify   # needs live keys
bun run release:check
```

## Known blockers

- Deploy workflow fails without `CLOUDFLARE_API_TOKEN`.
- Live signup requires Auth URL config + applied schema.
- Email features stay no-op until Resend + endpoint secrets are set.
