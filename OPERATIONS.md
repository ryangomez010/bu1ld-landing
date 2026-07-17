# Operations

## Daily / weekly

- Review `/admin` → applications, lead requests, moderation, evidence claims.
- Check Cloudflare Worker analytics and error logs.
- Confirm Resend delivery (if email enabled).
- Scan Discord / contact inbox for partnership proposals.

## Member lifecycle

1. Signup → onboarding → directory visibility optional.
2. Apply to project/program → review queue.
3. Acceptance → membership + notifications.
4. Invitations for direct team adds (`/invitations`).
5. Contributions verified by leads; public visibility gated.
6. Offboarding: account security → delete (service role path) or pause memberships.

## Incidents

| Symptom                     | Check                                       |
| --------------------------- | ------------------------------------------- |
| “Supabase not configured”   | `runtime-env.js`, build env, wrangler vars  |
| Signup works, profile empty | Trigger / RLS on `profiles` insert          |
| Lead cannot accept          | Capacity RPC, lead_id match, admin override |
| Deploy 403                  | Cloudflare token scopes                     |
| Email 401                   | `EMAIL_API_SECRET` or session bearer        |

## Migrations

- Never edit applied phases in place for production; add `phaseN+1.sql`.
- Record in `schema_migrations`.
- Run `VERIFY_SETUP.sql` after apply.

## Backups

Use Supabase dashboard PITR / `scripts/backup-supabase.mjs` when `SUPABASE_DB_URL` is available. Store off-platform.
