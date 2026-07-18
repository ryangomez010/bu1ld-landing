# Owner Actions

**Credentialed or external-approval steps only.** Ordinary engineering work belongs in [IMPLEMENTATION_QUEUE.md](./IMPLEMENTATION_QUEUE.md).

Last updated: Phase 4 packaging, 2026-07-18

---

## OA-1 — Apply database setup

**Audit IDs:** AUD-002, AUD-003, AUD-020  
**Queue:** Q1

### Action

```text
Paste supabase/FINAL_SETUP.sql into Supabase SQL editor and run it
(or apply through supabase/phase32.sql if earlier phases already exist).
Paste supabase/VERIFY_SETUP.sql and run it.
```

Alternative CLI (with `SUPABASE_DB_PASSWORD` in `.env`):

```bash
bun run supabase:apply
```

### Expected result

- Every row from `VERIFY_SETUP.sql` has `status = 'ok'`
- `SELECT slug FROM labs` returns seed rows
- phase26 tables present (`research_paths`, `project_datasets`, `project_application_questions`)
- phase27: `project_contributions.assigned_reviewer_id` + `assign_contribution_reviewer` RPC
- phase28: anon can SELECT public milestones + verified public contributions
- phase29: `projects.weekly_commitment_hours` column + check constraint
- phase30: public project-catalog grants + server-side project brief/resource validation
- phase31: competition/invitation/deliverable/membership integrity RPCs + seeded published programs
- phase32: contribution authors cannot review themselves or be assigned as their own reviewer
- `bun run supabase:verify` and `bun run supabase:rls` pass

### Optional — open competition

```sql
update public.competitions set status = 'open' where slug = 'defect-worlds-challenge';
```

---

## OA-2 — Configure Supabase Auth

**Audit IDs:** AUD-004  
**Queue:** Q3

### Action

In Supabase dashboard → Authentication:

- **Site URL:** `https://<production-domain>`
- **Redirect URLs:**
  - `https://<production-domain>/auth/callback`
  - `https://<production-domain>/reset-password`
- Enable GitHub and/or Google OAuth providers with client IDs/secrets

### Expected result

- OAuth returns to `/auth/callback`
- Password reset links land on `/reset-password`

---

## OA-3 — Configure deployment variables

**Audit IDs:** AUD-001, AUD-005  
**Queue:** Q2, Q5

### Public (client-safe)

| Variable                                                    | Required         |
| ----------------------------------------------------------- | ---------------- |
| `VITE_SUPABASE_URL`                                         | Yes              |
| `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes              |
| `VITE_EMAIL_ENDPOINT`                                       | Yes (production) |
| `VITE_ACCOUNT_DELETION_ENDPOINT`                            | Yes (production) |

### Server-only (never `VITE_` prefix)

| Variable                    | Required |
| --------------------------- | -------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes      |
| `RESEND_API_KEY`            | Yes      |
| `DIGEST_API_SECRET`         | Yes      |
| `EMAIL_API_SECRET`          | Optional |

### Verification-only

| Variable                                           | Purpose           |
| -------------------------------------------------- | ----------------- |
| `SUPABASE_DB_URL`                                  | Schema/RLS verify |
| or `SUPABASE_PROJECT_REF` + `SUPABASE_DB_PASSWORD` | Schema/RLS verify |

### Expected result

```bash
BU1LD_RELEASE_STRICT=1 bun run release:prod
```

passes in deployment environment.

---

## OA-4 — Configure Storage

**Audit IDs:** AUD-007  
**Queue:** Q4

### Action

In Supabase dashboard → Storage:

- Configure avatar/file bucket policies
- Deny cross-user writes

### Expected result

- Member A cannot upload to Member B's path (manual test)

---

## OA-5 — Configure email sender

**Audit IDs:** AUD-005  
**Queue:** Q2

### Action

- Set `RESEND_API_KEY` in server runtime
- Verify sender domain in Resend
- Optional: `EMAIL_FROM=The Bu1ld <hello@thebu1ld.com>`

### Expected result

- Password recovery email delivers
- Notification email delivers
- Digest dry-run completes: POST to digest endpoint with `DIGEST_API_SECRET`

---

## OA-6 — Run role smoke tests

**Audit IDs:** AUD-006  
**Queue:** Q6

### Action

Create separate test accounts and execute flows in [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md):

| Account         | Verify                           |
| --------------- | -------------------------------- |
| Visitor         | Public routes only               |
| New member      | Onboarding, profile              |
| Active member   | Apply, save, contribute          |
| Project lead    | Review applications, manage team |
| Reviewer/mentor | Review assigned contributions    |
| Administrator   | Admin tabs, claims, moderation   |
| Removed member  | Access denied to project         |

### Expected result

- Each account accesses only permitted data/actions
- Results documented in RELEASE_CHECKLIST checkboxes

---

## OA-7 — Deploy to staging/production

**Queue:** Q5

### Action

- Cloudflare: ensure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in GitHub secrets
- Or Vercel: configure per README/DEPLOYMENT.md
- Set all OA-3 variables in deployment platform

### Expected result

- Site loads on canonical domain
- Auth and member flows work end-to-end

---

## Not owner actions (code team)

- CI typecheck addition (Q9)
- Admin claim URL validation (Q12)
- E2E suite (Q18)
- Experiment/startup schema (Q15–Q16)

See [IMPLEMENTATION_QUEUE.md](./IMPLEMENTATION_QUEUE.md).

## Legacy reference

Root file [REMAINING_EXTERNAL_ACTIONS.md](../REMAINING_EXTERNAL_ACTIONS.md) preserved; this doc is canonical for Pass 2+.
