# Persistent Portfolio Memory

Updated: 2026-10-10.

## Current canonical choices

- BU1LD governed path for this pass: `/Volumes/PRO-BLADE/GitHubRepos/BU1LD-Web`.
- FinanceMeta source path: `/Volumes/PRO-BLADE/GitHubRepos/Finance4all-Web/finance4all-global-reach`.
- Genesis flagship source was relocated to `/Volumes/PRO-BLADE/GitHubRepos/Old-Stuff/Genesis`; its archive/activation decision is open.
- GenesisE source was relocated to `/Volumes/PRO-BLADE/GitHubRepos/Old-Stuff/GenesisE`; its synthetic-only boundary remains.
- MonteCarlo is still empty and archived unless a precise objective is supplied.
- `research/SOURCE_BINDINGS.json` records all recovered named source identities and limitations.
- Every project now has `research/project-states/<id>/STATE.json` and append-only `HISTORY.jsonl`.
- ESNF and NFGM have no verified source. PI-JEPA is recovered source, not a proven standalone repository. IPII remains partially unresolved.

## Do not forget

- Do not treat README claims as evidence.
- Do not claim BU1LD or FinanceMeta production readiness without live Supabase checks and manual role smoke tests.
- Do not claim Genesis publication readiness until multi-seed public benchmark artifacts exist.
- Do not claim GenesisE real-market validity from synthetic artifacts.
- Preserve existing dirty worktree changes; they may be user work.
- Source binding, state initialization, tests, and smoke runs do not advance scientific checkpoints by themselves.
- Protected evaluation remains closed until Checkpoint 7 is explicitly frozen.
- Member evidence is entered through `/workspace`; durable memberships grant access, and a submitted contribution remains unverified until an eligible independent reviewer accepts it.

## Next exact handoff

Use `research/pipeline/ACTION_QUEUE.json` and start with bounded repository-owned state reconciliation. Read the selected project's state/history first, enforce resource admission and one-writer ownership, then preserve any negative, mixed, inconclusive, invalid, failed, frozen, or dirty state. Project Genesis remains a flagship candidate, but its relocated archive status must be resolved before active reproduction work.
