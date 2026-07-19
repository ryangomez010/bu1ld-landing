# Evidence

Updated: 2026-07-19

## Landing completion verification (this pass)

| Command | Result |
| --- | --- |
| `bun run typecheck` | pass |
| `bun run lint` | pass |
| `bun run test` | pass — 151 tests |
| `bun run smoke` | pass — 22 critical paths |
| `bun run release:check` | pass — “Code release checks passed” |
| `bun run build` | pass (via release:check) |
| `bun run audit:ci` | pass |
| `node scripts/portfolio-preflight.mjs --roots /Users/ryan/Downloads/the-bu1ld-nexus-main --no-write` | pass locally; remaining blockers are dirty tree + live Supabase + role smokes |

## Evidence boundary

Local source checks only. No live production Auth/RLS/role journey was executed in this pass. `BU1LD_RELEASE_STRICT=1` was not run against deployment credentials.

## Key landing proof points

- `src/lib/landing-release.test.ts` asserts project-first CTAs, no GenesisIntro gate, no nav clocks, private robots/sitemap rules, anon fetch column guard, and truthful status labels.
- `src/lib/seo.test.ts` asserts canonical/social URL alignment.
- `src/lib/production-copy.test.ts` and `src/lib/content-integrity.test.ts` still guard unsupported claims and setup copy.

