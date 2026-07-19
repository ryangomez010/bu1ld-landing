# Experiment Roadmap

## Pass 2 queue

1. Genesis clean reproduction:
   - run install/test/smoke
   - validate existing artifacts
   - freeze five-seed public benchmark matrix
   - write artifact manifest contract
2. BU1LD release synchronization:
   - inspect latest phases 25–32
   - confirm `FINAL_SETUP.sql` includes latest safe phase
   - rerun local release gate after dirty changes are resolved
   - define manual role smoke script
3. FinanceMeta branch audit:
   - inspect dirty branch
   - rerun Vitest/typecheck/build
   - run RLS matrix when credentials exist
4. GenesisE artifact reproduction:
   - run unittest
   - regenerate portfolio/validation/benchmark artifacts in a new output directory
   - diff report summaries against committed artifacts
5. Archive or scope MonteCarlo:
   - if retained, define one research question, one synthetic generator, and one smoke test

## Flagship Genesis experiment matrix

| Experiment | Dataset | Baselines | Seeds | Primary metric | Status |
| --- | --- | --- | --- | --- | --- |
| Synthetic smoke | built-in synthetic | static/dense/random growth | 1+ | final average accuracy | artifact exists |
| Continual smoke | built-in continual | EWC/SI/replay/static | 1+ | task matrix/forgetting | artifact exists |
| Split MNIST campaign | public MNIST | EWC/SI/replay/static/dense | 5+ | final average accuracy + forgetting | queued |
| Permuted MNIST campaign | public MNIST | same | 5+ | final average accuracy + calibration | queued |
| CIFAR10 campaign | public CIFAR10 | same | 5+ | accuracy + compute/capacity | queued |
