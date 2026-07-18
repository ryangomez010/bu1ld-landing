# Production readiness — The Bu1ld Nexus

**Date:** 2026-07-18  
**Verdict:** **READY AFTER CONFIGURATION**

The public product surface is cleaned of setup/SQL/dev language, automated gates pass, and core public routes load. Live launch still requires applying schema on Supabase and configuring production secrets/domain auth.

## What was fixed for public use

- Removed SQL phase / local-only / “live database” / “Supabase is required” copy from admin, member, and error strings
- Competition planning copy no longer mentions the database
- Privacy policy no longer exposes internal infrastructure jargon
- Expanded `public/sitemap.xml` for institution pages
- Hardened labs/competitions fetches with timeouts + seed fallback so pages do not spin forever
- Honest empty state when no projects are published yet
- Strengthened `production-copy` test to block setup language regressions

## Gates (evidence)

| Command | Result |
| --- | --- |
| `bun run typecheck` | PASS |
| `bun run test` | 127 pass / 0 fail |
| `bun run lint` | PASS |
| `bun run smoke` | 22 critical paths OK |
| `bun run release:check` | PASS |
| `bun run build` | PASS |

## Browser-checked public routes

- `/` homepage — loads, clear CTAs, no fake metrics
- `/labs` — six labs after catalog/seed fallback
- `/apply` — program paths + labs
- `/signup` — form + OAuth buttons
- `/projects` — public browse; empty state when DB has no published projects
- `/competitions` — catalog with honest “not open yet” messaging
- `/privacy` — legal content

## Remaining owner blockers (not code)

1. Apply `supabase/FINAL_SETUP.sql` through **phase31** on the production Supabase project  
2. Confirm at least one **published open project** and open program cycles if you want the directory non-empty on day one  
3. Production env: `VITE_SUPABASE_*`, email/digest/service-role secrets, Auth Site URL + OAuth redirects for the live domain  
4. Deploy (`bun run deploy:cf` / release pipeline) and run `BU1LD_RELEASE_STRICT=1 bun run release:check` in that environment  
5. Disk space on this machine is nearly full (~200MB free) — free space before large builds/deploys

## What visitors will see as working today

Membership signup/login UI, institution pages (labs, programs, apply, partnerships, evidence, competitions), legal pages, and project discovery. Member portal features depend on live Auth + applied schema; without phase31 on the live DB, some write paths will correctly show temporary-unavailable errors rather than fake success.
