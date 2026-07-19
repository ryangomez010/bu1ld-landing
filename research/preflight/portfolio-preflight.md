# Portfolio Preflight Report

Generated: 2026-07-19T07:22:21.304Z

## Summary

- Projects inspected: 6
- Dirty projects: 5
- Projects with secret-like source risks: 2
- Projects with broken local Markdown links: 0
- Total release blockers: 23

## Projects

### bu1ld-nexus

- Root: `/Users/ryan/Downloads/the-bu1ld-nexus-main`
- Branch: main
- Classification: PRODUCT
- Evidence level: E4
- Dirty entries: 65
- SQL migrations detected: 37
- Commands: install = `bun install`; test = `bun run test`; typecheck = `bun run typecheck`; lint = `bun run lint`; build = `bun run build`; release:check = `bun run release:check`; release:prod = `bun run release:prod`
- Placeholder/source-risk matches: 40
- Secret-like source-risk matches: 25
- Broken local Markdown links: 0

Release blockers:

- 65 dirty git entries require review
- secret-like literals require human review
- resolve current dirty worktree before final release branch
- run live Supabase FINAL_SETUP/VERIFY_SETUP
- run role smoke tests with visitor/member/project lead/reviewer/admin accounts

### financemeta

- Root: `/Users/ryan/Downloads/finance4all-global-reach-main`
- Branch: cursor/membership-security-supabase-fix
- Classification: PRODUCT
- Evidence level: E4
- Dirty entries: 46
- SQL migrations detected: 26
- Commands: install = `bun install`; test = `bun run test`; typecheck = `bun run typecheck`; lint = `bun run lint`; build = `bun run build`; release:check = `bun run release:check`
- Placeholder/source-risk matches: 32
- Secret-like source-risk matches: 19
- Broken local Markdown links: 0

Release blockers:

- 46 dirty git entries require review
- secret-like literals require human review
- inspect 24 dirty changes before building further
- run release checks after dirty branch is stabilized
- compare overlapping member-platform patterns with BU1LD to avoid generic duplication

### project-genesis

- Root: `/Users/ryan/Documents/Genesis`
- Branch: codex/portfolio-finalization-20260715
- Classification: FLAGSHIP
- Evidence level: E4
- Dirty entries: 5
- SQL migrations detected: 0
- Commands: install = `python3 -m pip install -e .`; test = `python3 -m pytest -q || PYTHONPATH=src python3 -m unittest discover -s tests -v`
- Placeholder/source-risk matches: 0
- Secret-like source-risk matches: 0
- Broken local Markdown links: 0

Release blockers:

- 5 dirty git entries require review
- complete declared public benchmark campaign with multiple seeds
- freeze model-selection protocol before held-out reporting
- produce final tables/figures from raw artifacts
- independent reproduction

### genesis-econ

- Root: `/Users/ryan/Documents/GenesisE`
- Branch: main
- Classification: CORE
- Evidence level: E4
- Dirty entries: 9
- SQL migrations detected: 0
- Commands: install = `python3 -m pip install -e .`; test = `python3 -m pytest -q || PYTHONPATH=src python3 -m unittest discover -s tests -v`
- Placeholder/source-risk matches: 0
- Secret-like source-risk matches: 0
- Broken local Markdown links: 0

Release blockers:

- 9 dirty git entries require review
- decide whether this merges under FinanceMeta research or remains standalone
- add real public economics datasets only if claims expand beyond synthetic worlds
- strengthen nearest-baseline comparison for each of 24 programs

### montecarlo

- Root: `/Users/ryan/Documents/MonteCarlo`
- Branch: main
- Classification: ARCHIVE
- Evidence level: E0
- Dirty entries: 2
- SQL migrations detected: 0
- Commands: none detected
- Placeholder/source-risk matches: 2
- Secret-like source-risk matches: 0
- Broken local Markdown links: 0

Release blockers:

- 2 dirty git entries require review
- decide whether to archive or seed with a real objective
- evidence level E0 is below runnable release threshold

### visualization-scratch

- Root: `/Users/ryan/.codex/visualizations/2026/07/12/019f558a-453d-7cb0-8943-42c7b533d6eb`
- Branch: unknown
- Classification: ARCHIVE
- Evidence level: E0
- Dirty entries: 0
- SQL migrations detected: 0
- Commands: none detected
- Placeholder/source-risk matches: 0
- Secret-like source-risk matches: 0
- Broken local Markdown links: 0

Release blockers:

- evidence level E0 is below runnable release threshold

