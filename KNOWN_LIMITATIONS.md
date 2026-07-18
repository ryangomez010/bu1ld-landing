# Known Limitations

Honest inventory as of Phase 4 packaging (2026-07-18).

## Externally blocked

| Item                                  | Why                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `bun run release:prod`                | Needs live `SUPABASE_DB_*`, service role, Resend, digest, email endpoint |
| Live RLS/schema verify                | Needs DB credentials                                                     |
| OAuth / password reset on prod domain | Dashboard Site URL + redirects                                           |
| Email, digest, account deletion       | Deployed handlers + secrets                                              |
| Separate-account role smoke tests     | Manual with live project                                                 |

## Implemented but partially verified

| Item                           | Notes                                                                   |
| ------------------------------ | ----------------------------------------------------------------------- |
| phase26–phase32 schema/RPCs    | Code + SQL present; must be applied on live Supabase                    |
| Public `/evidence` outputs     | Empty until leads mark milestones public and verify public contributions |
| Public `/publications`         | Needs published papers with `review_status = published`                 |
| Competition submissions        | Blocked when catalog falls back to `seed-*` IDs                         |
| Analytics                      | No-op until `VITE_ANALYTICS_DOMAIN` is set                              |
| Research path progress         | Upserts when Supabase configured; silent no-op otherwise                |
| Assigned contribution reviewer | Client gate + SQL/RPC + self-review ban shipped; live role smoke not executed |

## Not completed (deferred)

| Item                                   | Status                                      |
| -------------------------------------- | ------------------------------------------- |
| Playwright browser E2E suite           | Route registry smoke only (`bun run smoke`) |
| Startup confidentiality CRM            | Deferred                                    |
| Immutable experiment run/metrics model | Beyond phase25 experiment rows              |
| People / partnerships CMS              | Still static `institution.ts`               |
| Guides as DB content                   | Bundled modules                             |

## Untruthful claims avoided

Seed and UI copy are scanned for unsupported affiliation, customer, and benchmark phrases. Public institutional claims require evidence URL + admin verify.
