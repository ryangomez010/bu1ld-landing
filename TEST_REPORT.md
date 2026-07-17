# The Bu1LD Test Report

Generated during the final production-hardening pass.

## Verified commands

| Command                 | Result          | Notes                                                                                                                                                                                       |
| ----------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run typecheck`     | Passed          | TypeScript route, schema, and library types compile.                                                                                                                                        |
| `bun run test`          | Passed          | 90 tests passed across 18 files, including paper analyzer, release artifacts, role helpers, auth guards, security utilities, digest/email handlers, production copy, and content integrity. |
| `bun run format`        | Passed          | Prettier completed across source, docs, scripts, SQL, and configuration files.                                                                                                              |
| `bun run lint`          | Passed          | ESLint completed without reported errors.                                                                                                                                                   |
| `bun run build`         | Passed          | Production client and SSR builds completed successfully.                                                                                                                                    |
| `bun run release:check` | Passed          | Local release gate completed typecheck, tests, lint, production build, copy/security scans, and artifact checks.                                                                            |
| `bun run release:prod`  | Blocked locally | Strict gate correctly stopped on missing deployment-only secrets and live database verification credentials.                                                                                |

## Feature coverage added in this pass

- Paper analyzer library validation, SHA-256 hashing, structural extraction, and safety note behavior.
- Member-only paper analyzer route with loading, empty, success, error, and database-unavailable states.
- Private `paper_analyses` Supabase table with explicit authenticated grants, anon revocation, row-level security, JSON-shape constraints, and setup verification.
- Release gate updated to require all final migrations through phase 24 and this test report.

## Manual production checks after environment setup

- Apply `supabase/FINAL_SETUP.sql`, then run `supabase/VERIFY_SETUP.sql`.
- Run `bun run release:prod` with production secrets and database access; the local shell is missing `SUPABASE_DB_PASSWORD` or `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DIGEST_API_SECRET`, and `VITE_EMAIL_ENDPOINT`.
- Smoke-test `/research/analyze` as a member: analyze text, confirm saved analysis appears, delete it, and verify another member cannot read it.
