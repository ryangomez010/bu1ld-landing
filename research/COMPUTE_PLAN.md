# Compute Plan

## CPU-safe checks

- BU1LD: `bun run test`, `bun run typecheck`, `bun run lint`, `bun run build`, `bun run release:check`.
- FinanceMeta: `npm run test`, `npm run typecheck`, `npm run build`, `npm run release:check`.
- Genesis: `python -m pytest`, `bash scripts/verify_release.sh`, synthetic configs.
- GenesisE: `PYTHONPATH=src python3 -m unittest discover -s tests -v`, `genesis-econ portfolio --steps 160 --seed 7`.

## GPU / higher-compute candidates

- Genesis public vision benchmarks: Split MNIST/Permuted MNIST likely CPU-feasible; CIFAR10 campaigns may benefit from GPU.
- No GPU requirement found for GenesisE.

## External services

- BU1LD and FinanceMeta strict release checks require Supabase credentials and email/provider secrets.
- External dataset downloads for Genesis require explicit `--download-data`.

## Budget discipline

Do not run full multi-seed public benchmarks until the protocol, baselines, seeds, metrics, and artifact directories are frozen.
