# Project Prioritization

## Priority order for Pass 2

1. **Project Genesis — FLAGSHIP.** Finish the evidence ladder: clean install, tests, smoke, five-seed benchmark plan, baseline fairness, manuscript claim freeze.
2. **BU1LD — PRODUCT.** Stabilize dirty branch, synchronize latest migrations, run release gate, then live Supabase/role smoke tests.
3. **FinanceMeta — PRODUCT.** Review dirty branch, run release checks, validate RLS/e2e golden journey, preserve differentiation from BU1LD.
4. **GenesisE — CORE.** Regenerate artifacts from CLI, validate benchmark, decide whether to keep standalone or expose through FinanceMeta.
5. **MonteCarlo — ARCHIVE unless scoped.** Add objective or archive.

## Classification table

| Project | Class | Why |
| --- | --- | --- |
| Project Genesis | FLAGSHIP | Most complete research package with paper/audit artifacts and falsifiable ML experiments. |
| BU1LD Nexus | PRODUCT | Institutional product with real member/project/evidence workflows. |
| FinanceMeta | PRODUCT | Finance member platform with Supabase/e2e infrastructure. |
| GenesisE | CORE | Reproducible synthetic research package; credible if claims stay scoped. |
| MonteCarlo | ARCHIVE | No auditable content. |

## Frozen minimum complete releases

- Genesis: code, synthetic and public dataset configs, faithful baselines, five seeds, ablations, stats, raw artifacts, paper update from artifacts only.
- BU1LD: app, Supabase migrations through latest phase, strict release gate, role smoke tests, public-claim evidence register.
- FinanceMeta: app, Supabase migrations, RLS matrix, member golden journey, Playwright e2e, finance disclaimers.
- GenesisE: CLI, artifacts regenerated from clean command, validation, synthetic-only model card, benchmark limitations.
