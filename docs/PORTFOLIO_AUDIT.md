# Portfolio Audit

## The Bu1ld

The Bu1ld is the current production-critical project. It has a broad route surface, Supabase-backed authentication, profiles, saved content, applications, project contribution tracking, programmes, admin publishing, moderation, notifications, and an evidence register. It is meaningfully distinct from Finance4All when it stays focused on machine-learning research outputs: paper reading, explainers, scoped research/startup projects, contribution evidence, project milestones, cohorts, events, and institutional claim verification.

Primary risks are live Supabase migration drift, service-role/email configuration, and making sure every protected path is tested with separate accounts.

## Finance4All / FinanceMeta

Finance4All is a separate finance education and member portal. It should not be used as a code or IA template for The Bu1ld beyond shared platform hygiene. Its existing README and docs already describe a production-readiness path and launch checklist. Any future shared work should be infrastructure-only: test conventions, release gates, security utilities, and audit format.

## Project Genesis

Genesis is a Python research package rather than a web portal. It is active development with reproducibility documentation, CLI entry points, and tests. Launch means a research artifact release, not a membership-platform release.

## GenesisE

GenesisE is a dependency-free Python research laboratory for synthetic economic intelligence. It is active research infrastructure and should remain isolated from The Bu1ld portal except as a potential project/publication source.

## Portfolio blockers

- Live credentials and deployment state are not available in this local session.
- Cross-project CI status is unknown until each project runs its own test/build pipeline.
- The Bu1ld and Finance4All overlap in membership-platform mechanics but must not converge in brand, claims, or product promise.
