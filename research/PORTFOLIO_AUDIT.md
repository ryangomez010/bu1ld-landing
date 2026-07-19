# Portfolio Audit

Generated: 2026-07-19.

## Method

This pass inspected accessible workspace roots, package metadata, docs, tests, migrations, scripts, result artifacts, and shallow file trees while excluding heavy generated directories such as `node_modules`, `dist`, `build`, and `.git`. It did not rely on README claims as proof; claims were downgraded unless code, tests, or artifacts were found.

## Summary findings

1. **Project Genesis is the strongest research flagship.** It has a Python package, configs, tests, smoke runs, ablation artifacts, paper audit, and explicit limitations. It still needs the declared public multi-seed benchmark campaign before publication-level claims.
2. **GenesisE is credible as a synthetic economics core, not a real-market evidence system.** It has dependency-free code, artifacts, validation, and a local unittest suite that passed in this audit pass. Its claims must remain scoped to synthetic worlds unless real datasets are added.
3. **BU1LD and FinanceMeta are mature product systems but currently require branch stabilization and live credential verification.** Both have substantial docs, tests, Supabase migrations, release gates, and local test suites that passed in this audit pass. Neither should be called production-ready from local evidence alone.
4. **MonteCarlo is empty and should not consume active development time until scoped.**
5. **Many named ideas are not present as runnable repos.** They should be treated as E0/E1 until paths or code are supplied.

## Scientific risks

- Synthetic smoke tests are being used in several places; they are useful for correctness but not for external validation.
- Genesis and GenesisE both contain broad portfolios. Breadth risks shallow novelty unless one flagship per program is advanced with fair baselines.
- Finance/economics projects must not imply trading performance, investment advice, or real-economy causal validity from synthetic artifacts.
- BU1LD paper analyzer is a deterministic triage tool and must not be marketed as citation verification.

## Engineering risks

- BU1LD has current dirty changes unrelated to this audit (`src/components/GenesisIntro.tsx` deleted, landing/project route changes, untracked `.cursor/` and SEO files). Do not overwrite them without review.
- FinanceMeta has a dirty branch with 24 changed files. Treat as active work; rerun release checks only after review.
- Supabase migrations must remain synchronized with `FINAL_SETUP.sql`, verify scripts, and release gates.
- MonteCarlo has no manifest, tests, docs, or license.

## Light reworks performed in this pass

- Created central research registry and audit artifacts under `research/`.
- Added required root handoff/status docs under `docs/`.
- Added minimal archive manifest to MonteCarlo so future discovery records its empty state instead of rediscovering ambiguity.
