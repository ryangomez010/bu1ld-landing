# Nemotron Audit Request

## New reproducibility artifact

Run from `/Users/ryan/Downloads/the-bu1ld-nexus-main`:

```bash
bun run portfolio:preflight
```

Audit `research/preflight/portfolio-preflight.json` and challenge whether each blocker is accurate, too lenient, or too noisy. Verify that `.env` values are not printed and that evidence levels do not exceed the inspected artifacts.

## Claims to challenge

1. Project Genesis has enough evidence to be the flagship research release.
2. GenesisE should remain synthetic-only unless real datasets are added.
3. BU1LD and FinanceMeta are product lanes, not research evidence.
4. MonteCarlo should be archived.

## Evidence to inspect

- `research/PROJECT_REGISTRY.yaml`
- `research/VERIFIED_RESULTS_INDEX.yaml`
- `/Users/ryan/Documents/Genesis/docs/project/RESEARCH_AUDIT.md`
- `/Users/ryan/Documents/Genesis/runs/*/manifest.json`
- `/Users/ryan/Documents/GenesisE/artifacts/*.json`
- BU1LD and FinanceMeta release/test docs.

## Commands to reproduce in Pass 2

- Genesis: `python -m pytest`
- Genesis: `bash scripts/verify_release.sh`
- GenesisE: `PYTHONPATH=src python3 -m unittest discover -s tests -v`
- BU1LD: `bun run release:check`
- FinanceMeta: `npm run release:check`

## Failure modes to search for

- Unsupported novelty claims.
- Synthetic results presented as external evidence.
- Missing or mismatched seed pairing.
- Dirty worktree hiding generated artifacts.
- RLS or role authorization gaps.
- Broken migration/setup drift.

## Required verdict

Return one of: approve Pass 2 queue, reorder queue, downgrade flagship, or block publication/product release.
