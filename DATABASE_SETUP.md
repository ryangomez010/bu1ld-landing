# Database Setup — The Bu1ld

## New Supabase project

1. Open the Supabase SQL editor.
2. Paste and run the full contents of:

```text
supabase/FINAL_SETUP.sql
```

3. Paste and run:

```text
supabase/VERIFY_SETUP.sql
```

Expected result: every returned row has `status = 'ok'`.

## Existing Supabase project

Apply any missing phases in order:

```text
supabase/phase19.sql
supabase/phase20.sql
supabase/phase21.sql
supabase/phase22.sql
supabase/phase23.sql
supabase/phase24.sql
supabase/phase25.sql
```

Then run `supabase/VERIFY_SETUP.sql`.

## CLI verification

With public client variables in `.env`:

```bash
bun run supabase:verify
```

With live DB credentials:

```bash
SUPABASE_DB_URL="postgresql://..." bun run supabase:rls
```

or:

```bash
SUPABASE_PROJECT_REF="your-project-ref" SUPABASE_DB_PASSWORD="..." bun run supabase:rls
```

## Seed data

Use only after schema setup:

```bash
bun run supabase:seed
```

The seed data is demonstration content. It avoids fake partners, fake publications, fake traction, and unsupported impact metrics.

## Required client variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`

## Required server/deployment variables

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL` or `SUPABASE_DB_PASSWORD` plus `SUPABASE_PROJECT_REF`
- `RESEND_API_KEY`
- `DIGEST_API_SECRET`
- `VITE_EMAIL_ENDPOINT`
