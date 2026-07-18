# Test evidence

Date: 2026-07-18

## Final all-gates rerun

| Command | Result | Important output |
|---|---|---|
| `bun run release:check` | PASS | types, tests, lint, build, release scanners, phase32 invariants |
| `bun run audit:ci` | PASS | `bun audit --audit-level=high` reported no high/critical findings |
| `bun run smoke` | PASS | `Route smoke OK — 22 critical paths present.` |
| `git diff --check` | PASS after PROJECT_STATUS trailing-space fix | earlier failure limited to markdown metadata lines |

## Unit tests

Command: `bun run test` (inside release gate)

Result: pass, including:

- contribution self-review denials for leads/admins and assigned self-reviewers
- phase32 release-artifact invariants
- contribution export serialization
- production-copy scanner with `Supabase required` / `Connect Supabase` bans

## Local HTTP probe

Base: `http://127.0.0.1:8080`

Routes probed with status 200 and no fatal SSR error body:

`/`, `/labs`, `/programs-public`, `/projects`, `/evidence`, `/login`, `/signup`, `/privacy`, `/account/security`, `/admin`

Unauthenticated `/account/security` and `/admin` did not expose contribution export or admin overview content.

## Not run / blocked

| Check | Reason |
|---|---|
| `BU1LD_RELEASE_STRICT=1 bun run release:check` | Needs live DB/service/email secrets |
| `bun run supabase:verify` / `supabase:rls` | Needs credentials |
| Playwright keyboard/mobile AT suite | No staging identity matrix in this environment |
| Cloudflare production deploy verification | Needs `CLOUDFLARE_API_TOKEN` / account secrets |
