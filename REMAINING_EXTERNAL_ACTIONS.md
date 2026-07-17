# Remaining External Actions

Only credentialed or external-approval steps remain.

## 1. Apply database setup

Action:

```text
Paste supabase/FINAL_SETUP.sql into Supabase SQL editor and run it
(or apply supabase/phase25.sql if phases 1–24 already exist).
Paste supabase/VERIFY_SETUP.sql and run it.
```

Expected result:

```text
Every row returned by VERIFY_SETUP.sql has status = 'ok'.
Labs/competitions seed rows exist (SELECT slug FROM labs).
```

Optional: open a challenge for submissions:

```sql
update public.competitions set status = 'open' where slug = 'defect-worlds-challenge';
```

## 2. Configure Supabase Auth

Set in Supabase dashboard:

- Site URL: `https://<production-domain>`
- Redirect URLs:
  - `https://<production-domain>/auth/callback`
  - `https://<production-domain>/reset-password`

Expected result:

- OAuth returns to `/auth/callback`.
- Password reset links return to `/reset-password`.

## 3. Configure deployment variables

Public:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_EMAIL_ENDPOINT`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `DIGEST_API_SECRET`

Verification-only:

- `SUPABASE_DB_URL`

or:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

Expected result:

```bash
bun run release:prod
```

passes.

## 4. Configure email

Set:

- `RESEND_API_KEY`
- verified sender domain in Resend
- optional `EMAIL_FROM`

Expected result:

- password recovery, notification emails, and digest dry run complete without server errors.

## 5. Run final role smoke tests

Use separate accounts:

- visitor
- new member
- active member
- project lead
- reviewer/mentor
- administrator
- removed member

Expected result:

- each account can access only its permitted data and actions.
