# Portfolio Preflight Report

Generated: 2026-10-11T11:28:37.938Z

## Summary

- Projects inspected: 9
- Dirty projects: 7
- Projects with secret-like source risks: 1
- Projects with broken local Markdown links: 2
- Total release blockers: 27

## Projects

### bu1ld-nexus

- Root: `/Volumes/PRO-BLADE/GitHubRepos/BU1LD-Web`
- Branch: main
- Classification: PRODUCT
- Evidence level: E4
- Dirty entries: 25
- SQL migrations detected: 38
- Commands: install = `bun install`; test = `bun run test`; typecheck = `bun run typecheck`; lint = `bun run lint`; build = `bun run build`; release:check = `bun run release:check`; release:prod = `bun run release:prod`
- Placeholder/source-risk matches: 20
- Secret-like source-risk matches: 0
- Broken local Markdown links: 0

Release blockers:

- 25 dirty git entries require review
- resolve current dirty worktree before final release branch
- run live Supabase FINAL_SETUP/VERIFY_SETUP
- run role smoke tests with visitor/member/project lead/reviewer/admin accounts

### financemeta

- Root: `/Volumes/PRO-BLADE/GitHubRepos/Finance4all-Web/finance4all-global-reach`
- Branch: codex/finish-website-membership-portal-20261011
- Classification: PRODUCT
- Evidence level: E4
- Dirty entries: 0
- SQL migrations detected: 21
- Commands: install = `npm ci`; test = `npm run test`; typecheck = `npm run typecheck`; lint = `npm run lint`; build = `npm run build`; release:check = `npm run release:check`
- Placeholder/source-risk matches: 11
- Secret-like source-risk matches: 0
- Broken local Markdown links: 1

Release blockers:

- 1 broken local Markdown links detected
- inspect 24 dirty changes before building further
- run release checks after dirty branch is stabilized
- compare overlapping member-platform patterns with BU1LD to avoid generic duplication

### project-genesis

- Root: `/Volumes/PRO-BLADE/GitHubRepos/Old-Stuff/Genesis`
- Branch: codex/portfolio-finalization-20260715
- Classification: FLAGSHIP
- Evidence level: E4
- Dirty entries: 30
- SQL migrations detected: 0
- Commands: install = `python3 -m pip install -e .`; test = `python3 -m pytest -q || PYTHONPATH=src python3 -m unittest discover -s tests -v`
- Placeholder/source-risk matches: 4
- Secret-like source-risk matches: 0
- Broken local Markdown links: 0

Release blockers:

- 30 dirty git entries require review
- complete declared public benchmark campaign with multiple seeds
- freeze model-selection protocol before held-out reporting
- produce final tables/figures from raw artifacts
- independent reproduction

### genesis-econ

- Root: `/Volumes/PRO-BLADE/GitHubRepos/Old-Stuff/GenesisE`
- Branch: main
- Classification: CORE
- Evidence level: E4
- Dirty entries: 16
- SQL migrations detected: 0
- Commands: install = `python3 -m pip install -e .`; test = `python3 -m pytest -q || PYTHONPATH=src python3 -m unittest discover -s tests -v`
- Placeholder/source-risk matches: 1
- Secret-like source-risk matches: 0
- Broken local Markdown links: 0

Release blockers:

- 16 dirty git entries require review
- decide whether this merges under FinanceMeta research or remains standalone
- add real public economics datasets only if claims expand beyond synthetic worlds
- strengthen nearest-baseline comparison for each of 24 programs

### montecarlo

- Root: `/Volumes/PRO-BLADE/GitHubRepos/Old-Stuff/Everything Else/MonteCarlo`
- Branch: main
- Classification: ARCHIVE
- Evidence level: E0
- Dirty entries: 7
- SQL migrations detected: 0
- Commands: none detected
- Placeholder/source-risk matches: 3
- Secret-like source-risk matches: 0
- Broken local Markdown links: 0

Release blockers:

- 7 dirty git entries require review
- decide whether to archive or seed with a real objective
- evidence level E0 is below runnable release threshold

### olympus

- Root: `/Volumes/PRO-BLADE/GitHubRepos/olympus-cognitive-architecture`
- Branch: main
- Classification: RESEARCH_PLATFORM
- Evidence level: E2
- Dirty entries: 38
- SQL migrations detected: 0
- Commands: install = `python3 -m pip install -e .`; test = `python3 -m pytest -q || PYTHONPATH=src python3 -m unittest discover -s tests -v`
- Placeholder/source-risk matches: 0
- Secret-like source-risk matches: 0
- Broken local Markdown links: 0

Release blockers:

- 38 dirty git entries require review

### vertexed

- Root: `/Volumes/PRO-BLADE/GitHubRepos/vertexED.ai`
- Branch: main
- Classification: PRODUCT
- Evidence level: E2
- Dirty entries: 80
- SQL migrations detected: 36
- Commands: install = `npm ci`; test = `npm run test`; typecheck = `npm run typecheck`; lint = `npm run lint`; build = `npm run build`
- Placeholder/source-risk matches: 40
- Secret-like source-risk matches: 1
- Broken local Markdown links: 9

Release blockers:

- 80 dirty git entries require review
- secret-like literals require human review
- 9 broken local Markdown links detected

### obscured-records-agent

- Root: `/Volumes/PRO-BLADE/GitHubRepos/Obscured-Records`
- Branch: main
- Classification: PRODUCT
- Evidence level: E2
- Dirty entries: 1
- SQL migrations detected: 0
- Commands: install = `npm ci`; test = `npm run test`; typecheck = `npm run typecheck`; lint = `npm run lint`; build = `npm run build`
- Placeholder/source-risk matches: 40
- Secret-like source-risk matches: 0
- Broken local Markdown links: 0

Release blockers:

- 1 dirty git entries require review
- product registry entry has no detected SQL migrations

### pi-jepa

- Root: `/Volumes/PRO-BLADE/.portfolio/verification/jepa-source-recovery-20260924/R15-porous-source`
- Branch: main
- Classification: RESEARCH
- Evidence level: E1
- Dirty entries: 0
- SQL migrations detected: 0
- Commands: none detected
- Placeholder/source-risk matches: 0
- Secret-like source-risk matches: 0
- Broken local Markdown links: 0

Release blockers:

- evidence level E1 is below runnable release threshold

