# Cursor Handoff

## Current executable portfolio command

Before hardening an individual repo, run from BU1LD:

```bash
bun run portfolio:preflight
```

Inspect `research/preflight/portfolio-preflight.json` for dirty state, missing commands, migration presence, source risks, broken local Markdown links, evidence levels, and registry blockers.

## Primary hardening target

Project Genesis clean reproduction and benchmark hardening.

## Challenge these algorithms

- Sparse routing fairness versus dense/static routed baselines.
- Capacity activation versus random/scheduled growth.
- Continual-learning controls: EWC, SI, replay, and static routed baselines.
- Statistical report code: bootstrap CI, paired sign-flip test, multiplicity handling.

## Implementation targets

- Add a single command that writes a fresh reproduction manifest without overwriting committed artifacts.
- Add artifact schema validation for every run summary.
- Ensure failed seeds are retained in suite manifests.
- Add tests that reject benchmark reports missing baseline seed pairing.

## Measurable targets

- Clean checkout command completes on CPU smoke mode.
- Every produced artifact records config, seed, git status, environment, and command.
- Report generation fails if baseline seed sets do not match.
