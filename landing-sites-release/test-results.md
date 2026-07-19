# Test results — 2026-07-19

## The Bu1LD (`the-bu1ld-nexus-main`)

| Command | Result |
|---|---|
| `bun run typecheck` | PASS |
| `bun run release:check` | PASS |
| `bun run audit:ci` | PASS (no high findings) |
| `bun run smoke` | PASS — 22 critical paths |
| Focused landing/SEO/application tests | PASS — 27 assertions across seo, landing-release, application-submit, release-artifacts, production-copy |
| Full `bun test src/lib/*.test.ts` via release gate | PASS |
| Production build | PASS |
| Local HTTP probe on public routes | PASS — 12 public routes 200 with canonicals |
| `git diff --check` | PASS |

## FinanceMeta / VertexED / Obscured / Oakridge

Not re-executed for release claims in this pass because of dirty concurrent trees, missing git remotes, or incomplete root switch at verification time. Registry marks them accordingly.
