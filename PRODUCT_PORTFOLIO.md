# Product Portfolio

This workspace contains four product repositories. They are related by founder/operator context and overlapping research themes, not by a single deployable architecture.

| Project                   | Path                                                  | Classification                   | Purpose                                                                            | Launch potential                                                    | Current priority |
| ------------------------- | ----------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------- |
| The Bu1ld                 | `/Users/ryan/Downloads/the-bu1ld-nexus-main`          | Production-critical, near launch | Independent machine-learning research and building membership platform             | High after live Supabase, email, and final account smoke tests pass | 1                |
| Finance4All / FinanceMeta | `/Users/ryan/Downloads/finance4all-global-reach-main` | Near launch, related product     | Financial-literacy public site and member portal                                   | High after its own launch checklist and E2E suite pass              | 2                |
| Project Genesis           | `/Users/ryan/Documents/Genesis`                       | Active research product          | Reproducible ML research implementation for bounded developmental modular learning | Research release, not membership portal                             | 3                |
| GenesisE                  | `/Users/ryan/Documents/GenesisE`                      | Active research product          | Dependency-free economic-intelligence research laboratory                          | Research release, not membership portal                             | 4                |

## Shared infrastructure opportunities

- Reuse release gates, production copy scanners, and security utility test patterns between The Bu1ld and Finance4All.
- Reuse institutional claim discipline from The Bu1ld for public claims in Finance4All and the Genesis research projects.
- Keep Supabase schemas separate between The Bu1ld and Finance4All; their roles, data, and product promises differ.
- Keep Genesis and GenesisE as research packages. They should feed evidence and publications into The Bu1ld, not become portal code.

## Portfolio rule

No project should claim production readiness until its own build, tests, security checks, deployment configuration, and smoke journeys pass in the environment that will host it.
