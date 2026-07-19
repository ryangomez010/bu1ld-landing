# Deployment

Updated: 2026-07-19

## Local release gate

Run:

```bash
bun run release:check
```

This performs typecheck, tests, lint, and production build locally.

## Strict deployment gate

Before production release, run in the deployment environment:

```bash
BU1LD_RELEASE_STRICT=1 bun run release:check
```

The strict gate must have real production-safe environment variables and live Supabase access. Do not mark production ready if strict verification fails or is skipped.

## Supabase deployment

Required checks:

```bash
bun run supabase:verify
bun run supabase:rls
```

The live database must include the latest migration phase chain and pass RLS denial/allow checks.

## Portfolio preflight

Run:

```bash
bun run portfolio:preflight
```

This writes reproducible audit artifacts under `research/preflight/` and should be included in release-review packets.

## Deployment boundary

This repository contains local release tooling. Actual production release also depends on hosting credentials, domain configuration, Supabase project state, email provider state, and manual role smoke tests.
