# Portfolio Roadmap

## Priority 1: The Bu1ld production release

1. Apply Supabase schema phases through `phase22.sql`.
2. Run `bun run release:prod` in the deployment environment.
3. Smoke test visitor, member, project lead, reviewer, and administrator journeys.
4. Publish only evidence-backed institutional claims.

## Priority 2: Finance4All independent release

1. Run its documented unit, lint, type, build, and E2E checks.
2. Confirm its Supabase schema, Edge Functions, email sender, legal content, and monitoring.
3. Avoid importing The Bu1ld’s research-institution branding.

## Priority 3: Genesis research artifact hardening

1. Run `scripts/verify_release.sh`.
2. Preserve reproducibility constraints and avoid unsupported benchmark claims.
3. Use The Bu1ld as a publication/project surface only after artifacts are complete.

## Priority 4: GenesisE research artifact hardening

1. Run the unit suite and flagship validation command.
2. Confirm generated artifacts satisfy validation before publication.
3. Keep investment-advice disclaimers intact.

## Shared roadmap

- Standardize release checklist shape across projects.
- Add production-copy/claim scanners where public-facing copy exists.
- Keep deployment secrets isolated per product.
